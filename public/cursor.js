// Animated GIF cursor + seamless rainbow particle trail (canvas-based)
// Canvas particles are smoother + far less DOM-heavy.

const CURSOR_SIZE = 48;
const CURSOR_HALF = CURSOR_SIZE / 2;

const CURSOR_NORMAL_URL = window.__CURSOR_NORMAL_URL || 'assets/cursor.gif';
const CURSOR_REVERSED_URL = window.__CURSOR_REVERSED_URL || 'assets/cursor-reversed.gif';

// Emit particles from the mouse position (0,0). If you want the trail
// to come from a specific "tip" on your GIF, tweak these.
const EMIT_OFFSET_X = 0;
const EMIT_OFFSET_Y = 0;

// Particle tuning
const MAX_PARTICLES = 260;
const LIFE_MIN = 0.525; // seconds
const LIFE_MAX = 0.975; // seconds
const SIZE_MIN = 1.125; // px
const SIZE_MAX = 1.125; // px
const DRAG = 0.90; // velocity drag per frame-ish (dt-scaled)
const SPEED_SPREAD = 0.135; // how much mouse speed affects particle spray

// Spawn tuning (continuous + seamless): spawn based on distance moved.
const PARTICLES_PER_PX = 0.18; // particles per pixel traveled
const IDLE_PARTICLES_PER_SEC = 22; // particles when barely moving

// Rainbow tuning
const HUE_SPEED = 220; // deg/sec

// Breathing glow for the main cursor
const style = document.createElement('style');
style.textContent = `
  @keyframes breathingGlow {
    0%, 100% {
      filter: drop-shadow(0 0 12px rgba(255,0,0,0.75)) drop-shadow(0 0 22px rgba(255,80,80,0.55));
    }
    50% {
      filter: drop-shadow(0 0 22px rgba(255,0,0,0.90)) drop-shadow(0 0 38px rgba(255,80,80,0.70));
    }
  }
  .custom-cursor-main {
    animation: breathingGlow 3.2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

// Main cursor element (GIF)
const cursorEl = document.createElement('div');
cursorEl.className = 'custom-cursor-main';
cursorEl.style.cssText = `
  position: fixed;
  left: 0;
  top: 0;
  width: ${CURSOR_SIZE}px;
  height: ${CURSOR_SIZE}px;
  background-image: url('${CURSOR_NORMAL_URL}');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 20000;
  transform: translate3d(-9999px, -9999px, 0);
  will-change: transform;
  display: none;
`;
document.body.appendChild(cursorEl);

// Particle canvas
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-hidden', 'true');
canvas.style.cssText = `
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 19999;
  display: none;
`;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// State
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseVX = 0;
let mouseVY = 0;

let visible = false;
let lastTs = performance.now();
let distanceAccumulator = 0;
let hueBase = 0;

let hoveringLinkFromMessage = false;

const particles = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function showFX() {
  if (visible) return;
  visible = true;
  cursorEl.style.display = 'block';
  canvas.style.display = 'block';
}

function hideFX() {
  visible = false;
  cursorEl.style.display = 'none';
  canvas.style.display = 'none';
  // keep particles; they will naturally fade if you re-show, but also fine to clear
}

function setCursorImage(url) {
  cursorEl.style.backgroundImage = `url('${url}')`;
}

function addParticle(x, y, speed, hue) {
  if (particles.length >= MAX_PARTICLES) {
    particles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const burst = speed * SPEED_SPREAD;

  particles.push({
    x,
    y,
    vx: Math.cos(angle) * burst + (-mouseVX * 0.06),
    vy: Math.sin(angle) * burst + (-mouseVY * 0.06),
    age: 0,
    life: rand(LIFE_MIN, LIFE_MAX),
    size: rand(SIZE_MIN, SIZE_MAX),
    hue,
  });
}

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX + EMIT_OFFSET_X;
  mouseY = e.clientY + EMIT_OFFSET_Y;

  if (!visible) {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    showFX();
  }
});

// During pointer-capture drags (e.g. window dragging), browsers may stop firing
// `mousemove` on the document. Track pointer movement too so the custom cursor
// keeps updating.
document.addEventListener(
  'pointermove',
  (e) => {
    mouseX = e.clientX + EMIT_OFFSET_X;
    mouseY = e.clientY + EMIT_OFFSET_Y;

    if (!visible) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      showFX();
    }
  },
  { passive: true }
);

document.addEventListener(
  'pointerdown',
  (e) => {
    mouseX = e.clientX + EMIT_OFFSET_X;
    mouseY = e.clientY + EMIT_OFFSET_Y;
    if (!visible) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      showFX();
    }
  },
  { passive: true }
);

document.addEventListener('mouseleave', hideFX);

// Reverse cursor when hovering links
document.addEventListener('mouseover', (e) => {
  if (e.target.closest && e.target.closest('a')) {
    setCursorImage(CURSOR_REVERSED_URL);
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest && e.target.closest('a')) {
    setCursorImage(CURSOR_NORMAL_URL);
  }
});

// Support embedded iframes (e.g. linktree inside the XP desktop):
// The iframe forwards pointer move/hover/click to the parent so the cursor stays smooth.
window.addEventListener('message', (evt) => {
  const data = evt && evt.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'cursor-move') {
    if (typeof data.x === 'number' && typeof data.y === 'number') {
      mouseX = data.x + EMIT_OFFSET_X;
      mouseY = data.y + EMIT_OFFSET_Y;
      if (!visible) {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        showFX();
      }
    }

    if (typeof data.hoverLink === 'boolean' && data.hoverLink !== hoveringLinkFromMessage) {
      hoveringLinkFromMessage = data.hoverLink;
      setCursorImage(hoveringLinkFromMessage ? CURSOR_REVERSED_URL : CURSOR_NORMAL_URL);
    }
  }

  if (data.type === 'cursor-click') {
    if (typeof data.x === 'number' && typeof data.y === 'number') {
      addClickBurst(data.x + EMIT_OFFSET_X, data.y + EMIT_OFFSET_Y);
    }
  }
});

// Click event: spawn particles in a uniform 360-degree ring
document.addEventListener('click', (e) => {
  addClickBurst(e.clientX + EMIT_OFFSET_X, e.clientY + EMIT_OFFSET_Y);
});

// Disable right-click and spawn the same burst effect
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // Use client coordinates like the left-click handler
  addClickBurst(e.clientX + EMIT_OFFSET_X, e.clientY + EMIT_OFFSET_Y);
});

function addClickBurst(x, y) {
  const particleCount = 36; // Evenly distributed around 360°
  const burstSpeed = 220; // Speed outward from click point

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2; // Perfect 360° distribution
    const hue = (hueBase + i * 10) % 360;

    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * burstSpeed,
      vy: Math.sin(angle) * burstSpeed,
      age: 0,
      life: rand(LIFE_MIN, LIFE_MAX),
      size: rand(SIZE_MIN, SIZE_MAX),
      hue,
    });
  }
}

function drawParticle(p, alpha) {
  const r = p.size;
  const color = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
  const glow = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.9})`;

  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
  g.addColorStop(0, color);
  g.addColorStop(0.55, glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function animate(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;

  if (visible) {
    // Cursor position (upper-left at mouse)
    cursorEl.style.transform = `translate3d(${(mouseX - EMIT_OFFSET_X)}px, ${(mouseY - EMIT_OFFSET_Y)}px, 0)`;

    // Mouse velocity + distance
    mouseVX = (mouseX - prevMouseX) / Math.max(dt, 1e-6);
    mouseVY = (mouseY - prevMouseY) / Math.max(dt, 1e-6);
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;
    const dist = Math.hypot(dx, dy);
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Seamless rainbow hue progression
    hueBase = (hueBase + HUE_SPEED * dt) % 360;

    // Distance-based continuous emission (plus idle rate)
    distanceAccumulator += dist * PARTICLES_PER_PX;
    distanceAccumulator += IDLE_PARTICLES_PER_SEC * dt;

    const speed = Math.hypot(mouseVX, mouseVY);
    const spawnCount = Math.min(24, Math.floor(distanceAccumulator));
    if (spawnCount > 0) {
      distanceAccumulator -= spawnCount;
      for (let i = 0; i < spawnCount; i++) {
        const t = spawnCount === 1 ? 1 : i / (spawnCount - 1);
        const x = mouseX - dx * t;
        const y = mouseY - dy * t;
        addParticle(x, y, speed, (hueBase + i * 6) % 360);
      }
    }

    // Clear + render
    resizeCanvas();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      const lifeT = p.age / p.life;
      if (lifeT >= 1) {
        particles.splice(i, 1);
        continue;
      }

      // Integrate
      const drag = Math.pow(DRAG, dt * 60);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Fade out smoothly
      const alpha = Math.sin((1 - lifeT) * (Math.PI / 2));
      drawParticle(p, alpha);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Hide native cursor (CSS also enforces this)
document.documentElement.style.cursor = 'none';
