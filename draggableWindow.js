// Minimal XP-like window system:
// - Drag via titlebar
// - Focus/z-index
// - Minimize (roll up), maximize (fullscreen), close
// - rAF-based dragging + cached rect to prevent edge flicker

(function () {
  const WINDOW_SELECTOR = '.lt-wrap';
  const TITLEBAR_SELECTOR = '.lt-titlebar, .title-bar';

  // Support both:
  // - XP markup: .xp-win-btn-*
  // - 98.css markup: .title-bar-controls button[aria-label=*]
  const BTN_MIN_SELECTOR = '.xp-win-btn-min, .title-bar-controls button[aria-label="Minimize"]';
  const BTN_MAX_SELECTOR = '.xp-win-btn-max, .title-bar-controls button[aria-label="Maximize"]';
  const BTN_CLOSE_SELECTOR = '.xp-win-btn-close, .title-bar-controls button[aria-label="Close"]';

  const CONTROLS_BLOCK_SELECTOR = '.xp-window-controls, .title-bar-controls';
  const RESIZE_HANDLE_CLASS = 'lt-resize-handle';
  const RESIZE_TARGET_SELECTOR = '.lt-window';

  const MARGIN = 12;
  const DRAG_THRESHOLD_PX = 1;
  const Z_BASE = 10;

  const MIN_RESIZE_W = 320;
  const MIN_RESIZE_H = 220;

  let topZ = Z_BASE;
  let suppressClick = false;

  function num(val, fallback = 0) {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  function getPos(winEl) {
    return {
      x: num(winEl.dataset.winX, 0),
      y: num(winEl.dataset.winY, 0),
    };
  }

  function setPos(winEl, x, y) {
    winEl.dataset.winX = String(x);
    winEl.dataset.winY = String(y);
    winEl.style.setProperty('--win-x', `${x}px`);
    winEl.style.setProperty('--win-y', `${y}px`);
  }

  function bringToFront(winEl) {
    topZ += 1;
    winEl.style.zIndex = String(topZ);
  }

  function nudgeIntoViewport(winEl) {
    if (!winEl || winEl.classList.contains('xp-window--maximized')) return;

    const display = window.getComputedStyle(winEl).display;
    if (display === 'none') return;

    const rect = winEl.getBoundingClientRect();
    const startPos = getPos(winEl);
    let x = startPos.x;
    let y = startPos.y;

    const maxRight = window.innerWidth - MARGIN;
    const maxBottom = window.innerHeight - MARGIN;

    if (rect.left < MARGIN) x += MARGIN - rect.left;
    if (rect.top < MARGIN) y += MARGIN - rect.top;
    if (rect.right > maxRight) x -= rect.right - maxRight;
    if (rect.bottom > maxBottom) y -= rect.bottom - maxBottom;

    if (x !== startPos.x || y !== startPos.y) setPos(winEl, x, y);
  }

  function setMaximized(winEl, enabled) {
    if (!winEl) return;

    const currently = winEl.classList.contains('xp-window--maximized');
    if (enabled === currently) return;

    if (enabled) {
      const pos = getPos(winEl);
      winEl.dataset.restoreWinX = String(pos.x);
      winEl.dataset.restoreWinY = String(pos.y);

      // Inline width/height would override the maximized CSS.
      winEl.dataset.restoreWinW = winEl.style.width || '';
      winEl.dataset.restoreWinH = winEl.style.height || '';
      winEl.style.width = '';
      winEl.style.height = '';

      winEl.classList.add('xp-window--maximized');
      winEl.classList.remove('xp-window--minimized');
      bringToFront(winEl);
      return;
    }

    winEl.classList.remove('xp-window--maximized');
    const rx = num(winEl.dataset.restoreWinX, getPos(winEl).x);
    const ry = num(winEl.dataset.restoreWinY, getPos(winEl).y);
    setPos(winEl, rx, ry);

    if (typeof winEl.dataset.restoreWinW === 'string') winEl.style.width = winEl.dataset.restoreWinW;
    if (typeof winEl.dataset.restoreWinH === 'string') winEl.style.height = winEl.dataset.restoreWinH;

    bringToFront(winEl);
    nudgeIntoViewport(winEl);
  }

  function clamp(n, minV, maxV) {
    return Math.min(maxV, Math.max(minV, n));
  }

  function winPosFromRect(leftPx, topPx, widthPx, heightPx) {
    const baseX = window.innerWidth / 2;
    const baseY = window.innerHeight / 2;
    return {
      x: leftPx - baseX + widthPx / 2,
      y: topPx - baseY + heightPx / 2,
    };
  }

  function wireResize(winEl) {
    if (!winEl) return;

    const target = winEl.querySelector(RESIZE_TARGET_SELECTOR) || winEl;
    if (target.querySelector(`.${RESIZE_HANDLE_CLASS}`)) return;

    const defaultDirs = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
    const rawDirs = typeof winEl.dataset.resize === 'string' ? winEl.dataset.resize.trim() : '';
    const handleDirs = rawDirs
      ? rawDirs
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
      : defaultDirs;

    handleDirs.forEach((dir) => {
      const h = document.createElement('div');
      h.className = RESIZE_HANDLE_CLASS;
      h.dataset.dir = dir;
      h.setAttribute('aria-hidden', 'true');
      target.appendChild(h);
    });

    let resizing = false;
    let activeDir = 'se';
    let startClientX = 0;
    let startClientY = 0;
    let startRect = null;
    let pointerId = null;
    let rafPending = false;
    let lastMoveX = 0;
    let lastMoveY = 0;

    function applyResize() {
      rafPending = false;
      if (!resizing || !startRect) return;

      const dx = lastMoveX - startClientX;
      const dy = lastMoveY - startClientY;

      const startLeft = startRect.left;
      const startTop = startRect.top;
      const startW = startRect.width;
      const startH = startRect.height;
      const startRight = startLeft + startW;
      const startBottom = startTop + startH;

      let nextLeft = startLeft;
      let nextTop = startTop;
      let nextW = startW;
      let nextH = startH;

      if (activeDir.includes('e')) nextW = startW + dx;
      if (activeDir.includes('s')) nextH = startH + dy;
      if (activeDir.includes('w')) {
        nextW = startW - dx;
        nextLeft = startLeft + dx;
      }
      if (activeDir.includes('n')) {
        nextH = startH - dy;
        nextTop = startTop + dy;
      }

      // Enforce minimum size while keeping the opposite edge anchored.
      if (nextW < MIN_RESIZE_W) {
        nextW = MIN_RESIZE_W;
        if (activeDir.includes('w')) nextLeft = startRight - nextW;
      }
      if (nextH < MIN_RESIZE_H) {
        nextH = MIN_RESIZE_H;
        if (activeDir.includes('n')) nextTop = startBottom - nextH;
      }

      // Constrain to viewport bounds.
      const maxRight = window.innerWidth - MARGIN;
      const maxBottom = window.innerHeight - MARGIN;

      // Left/top bounds.
      if (nextLeft < MARGIN) {
        if (activeDir.includes('w')) {
          nextW = startRight - MARGIN;
          nextLeft = MARGIN;
        } else {
          nextLeft = MARGIN;
        }
      }
      if (nextTop < MARGIN) {
        if (activeDir.includes('n')) {
          nextH = startBottom - MARGIN;
          nextTop = MARGIN;
        } else {
          nextTop = MARGIN;
        }
      }

      // Right/bottom bounds.
      if (nextLeft + nextW > maxRight) {
        if (activeDir.includes('e')) {
          nextW = maxRight - nextLeft;
        } else if (activeDir.includes('w')) {
          nextLeft = maxRight - nextW;
        }
      }
      if (nextTop + nextH > maxBottom) {
        if (activeDir.includes('s')) {
          nextH = maxBottom - nextTop;
        } else if (activeDir.includes('n')) {
          nextTop = maxBottom - nextH;
        }
      }

      // Re-apply min after clamping.
      if (nextW < MIN_RESIZE_W) {
        nextW = MIN_RESIZE_W;
        if (activeDir.includes('w')) nextLeft = startRight - nextW;
      }
      if (nextH < MIN_RESIZE_H) {
        nextH = MIN_RESIZE_H;
        if (activeDir.includes('n')) nextTop = startBottom - nextH;
      }

      // Respect CSS max-width/max-height if present.
      try {
        const cs = window.getComputedStyle(winEl);
        const maxW = Number.parseFloat(cs.maxWidth);
        const maxH = Number.parseFloat(cs.maxHeight);

        if (Number.isFinite(maxW) && maxW > 0 && nextW > maxW) {
          nextW = maxW;
          if (activeDir.includes('w')) nextLeft = startRight - nextW;
        }
        if (Number.isFinite(maxH) && maxH > 0 && nextH > maxH) {
          nextH = maxH;
          if (activeDir.includes('n')) nextTop = startBottom - nextH;
        }
      } catch {
        // ignore
      }

      winEl.style.width = `${Math.round(nextW)}px`;
      winEl.style.height = `${Math.round(nextH)}px`;

      const p = winPosFromRect(nextLeft, nextTop, nextW, nextH);
      setPos(winEl, p.x, p.y);
      nudgeIntoViewport(winEl);
    }

    function onPointerDown(e) {
      if (e.button !== 0) return;
      if (winEl.classList.contains('xp-window--maximized')) return;

      const dir = e.target && e.target.dataset ? e.target.dataset.dir : null;
      if (!dir) return;

      bringToFront(winEl);

      resizing = true;
      activeDir = dir;
      pointerId = e.pointerId;
      startClientX = e.clientX;
      startClientY = e.clientY;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      startRect = winEl.getBoundingClientRect();

      try {
        e.target.setPointerCapture(pointerId);
      } catch {
        // ignore
      }
      e.preventDefault();
      e.stopPropagation();
    }

    function onPointerMove(e) {
      if (!resizing) return;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(applyResize);
      }
      e.preventDefault();
      e.stopPropagation();
    }

    function endResize(e) {
      if (!resizing) return;
      resizing = false;
      startRect = null;
      if (pointerId != null && e && e.target) {
        try {
          e.target.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
      pointerId = null;
    }

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', endResize);
    target.addEventListener('pointercancel', endResize);
  }

  function clampToViewport(startRect, startPos, dxRaw, dyRaw) {
    const minDx = MARGIN - startRect.left;
    const maxDx = window.innerWidth - MARGIN - startRect.right;
    const minDy = MARGIN - startRect.top;
    const maxDy = window.innerHeight - MARGIN - startRect.bottom;

    const dx = Math.min(maxDx, Math.max(minDx, dxRaw));
    const dy = Math.min(maxDy, Math.max(minDy, dyRaw));

    return { x: startPos.x + dx, y: startPos.y + dy };
  }

  function wireWindow(winEl) {
    const titlebar = winEl.querySelector(TITLEBAR_SELECTOR);
    if (!titlebar) return;

    const btnMin = winEl.querySelector(BTN_MIN_SELECTOR);
    const btnMax = winEl.querySelector(BTN_MAX_SELECTOR);
    const btnClose = winEl.querySelector(BTN_CLOSE_SELECTOR);

    const allowMaximize = !!btnMax;

    // Ensure CSS vars reflect dataset (or defaults)
    const initial = getPos(winEl);
    setPos(winEl, initial.x, initial.y);
    nudgeIntoViewport(winEl);

    // Resizable via bottom-right grip
    wireResize(winEl);

    // Focus on pointerdown anywhere inside
    winEl.addEventListener('pointerdown', () => bringToFront(winEl));

    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        winEl.style.display = 'none';
      });
    }

    if (btnMin) {
      btnMin.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        winEl.classList.toggle('xp-window--minimized');
        if (!winEl.classList.contains('xp-window--minimized')) {
          bringToFront(winEl);
          nudgeIntoViewport(winEl);
        }
      });
    }

    if (btnMax) {
      btnMax.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMaximized(winEl, !winEl.classList.contains('xp-window--maximized'));
      });
    }

    // Double-click titlebar toggles maximize
    titlebar.addEventListener('dblclick', (e) => {
      if (!allowMaximize) return;
      if (e.target && e.target.closest && e.target.closest(CONTROLS_BLOCK_SELECTOR)) return;
      setMaximized(winEl, !winEl.classList.contains('xp-window--maximized'));
    });

    let isDragging = false;
    let moved = false;
    let startClientX = 0;
    let startClientY = 0;
    let startPos = { x: 0, y: 0 };
    let startRect = null;

    let rafPending = false;
    let lastMoveX = 0;
    let lastMoveY = 0;

    function applyDrag() {
      rafPending = false;
      if (!isDragging || !startRect) return;

      const dxRaw = lastMoveX - startClientX;
      const dyRaw = lastMoveY - startClientY;
      if (!moved && (Math.abs(dxRaw) > DRAG_THRESHOLD_PX || Math.abs(dyRaw) > DRAG_THRESHOLD_PX)) {
        moved = true;
      }

      const next = clampToViewport(startRect, startPos, dxRaw, dyRaw);
      setPos(winEl, next.x, next.y);
    }

    titlebar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(CONTROLS_BLOCK_SELECTOR)) return;

      // Common desktop UX: dragging a maximized window restores it first.
      if (allowMaximize && winEl.classList.contains('xp-window--maximized')) {
        setMaximized(winEl, false);

        // After restoring, shift it horizontally so the cursor stays on the same
        // relative point of the titlebar (feels much less "jumpy").
        const restoredRect = winEl.getBoundingClientRect();
        const ratioX = window.innerWidth > 0 ? e.clientX / window.innerWidth : 0.5;
        const safeRatioX = Math.min(1, Math.max(0, ratioX));
        const desiredLeft = e.clientX - restoredRect.width * safeRatioX;
        const dx = desiredLeft - restoredRect.left;
        if (Math.abs(dx) > 0.5) {
          const posNow = getPos(winEl);
          setPos(winEl, posNow.x + dx, posNow.y);
          nudgeIntoViewport(winEl);
        }
      }

      bringToFront(winEl);

      isDragging = true;
      moved = false;
      startClientX = e.clientX;
      startClientY = e.clientY;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      startPos = getPos(winEl);
      startRect = winEl.getBoundingClientRect();

      titlebar.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    titlebar.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(applyDrag);
      }
      e.preventDefault();
    });

    function endDrag(pointerId) {
      if (!isDragging) return;
      isDragging = false;
      startRect = null;
      if (moved) suppressClick = true;
      try {
        titlebar.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
    }

    titlebar.addEventListener('pointerup', (e) => endDrag(e.pointerId));
    titlebar.addEventListener('pointercancel', (e) => endDrag(e.pointerId));
  }

  function init() {
    const windows = Array.from(document.querySelectorAll(WINDOW_SELECTOR));
    if (windows.length === 0) return;

    windows.forEach((w) => wireWindow(w));
    bringToFront(windows[windows.length - 1]);

    // Keep windows within viewport when the device rotates / resizes.
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        windows.forEach((w) => nudgeIntoViewport(w));
      });
    });

    document.addEventListener(
      'click',
      (e) => {
        if (!suppressClick) return;
        suppressClick = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
