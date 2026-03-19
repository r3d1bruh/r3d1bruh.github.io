// links.js
// Edit the LINKS array to add/remove buttons without touching index.html.
// Each item supports: { label, href, icon, note }

(() => {
  /**
   * Prefer data from links.data.js, but keep a baked-in fallback so the page
   * still works if that file is missing.
   *
   * @type {{profile?: {handle?: string, sub?: string, avatar?: string}, links: {label: string, href: string, icon?: string, note?: string}[]}}
   */
  const FALLBACK_DATA = {
    profile: {
      handle: '@r3d1bruh',
      sub: 'All of my active social medias are here lol',
      avatar:
        'https://scontent-sin6-4.xx.fbcdn.net/v/t39.30808-6/340100685_242869148141993_7455233724421839500_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEB-iMxxIXs9XflEr9fdZq7MSL0NNC7z9MxIvQ00LvP0zX-zFxCTZVeakaGwxC8AvWRI8QYls4UcVcZUPR6uc-n&_nc_ohc=vLUzwBtF9xMQ7kNvgHAGmpA&_nc_zt=23&_nc_ht=scontent-sin6-4.xx&_nc_gid=Am72Uj-7AqXHSFnwUY5rqJ2&oh=00_AYBUYiLWX6rvLXqC2oHhMLXXb0MIuldLku5YS69DZe4pag&oe=6713214E',
    },
    links: [
      {
        label: 'Facebook',
        href: 'https://www.facebook.com/ridwanpradhan',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
        note: 'say hi',
      },
      {
        label: 'Instagram',
        href: 'https://www.instagram.com/r3d1bruh',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
        note: 'pics',
      },
      {
        label: 'Steam',
        href: 'https://steamcommunity.com/id/r3d1bruh',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg',
        note: 'game time',
      },
      {
        label: 'Discord',
        href: 'https://discord.com/users/r3d1bruh',
        icon: 'https://www.svgrepo.com/show/353655/discord-icon.svg',
        note: 'DMs open-ish',
      },
      {
        label: 'X (Twitter)',
        href: 'https://x.com/r3d1bruh',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png',
        note: 'posts',
      },
    ],
  };

  function getData() {
    const data = window.r3d1LinktreeData;
    if (!data || typeof data !== 'object') return FALLBACK_DATA;
    if (!Array.isArray(data.links)) return FALLBACK_DATA;
    return data;
  }

  function setData(next) {
    if (!next || typeof next !== 'object') return;
    if (!Array.isArray(next.links)) return;
    window.r3d1LinktreeData = next;
    renderLinktree();
  }

  function createElement(tag, className, attrs = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;
      node.setAttribute(key, String(value));
    }
    return node;
  }

  function renderProfile(profile) {
    const avatarEl = document.getElementById('lt-avatar');
    const handleEl = document.getElementById('lt-handle');
    const subEl = document.getElementById('lt-sub');

    if (avatarEl && profile && profile.avatar) {
      avatarEl.src = profile.avatar;
      avatarEl.loading = 'lazy';
      avatarEl.decoding = 'async';
    }
    if (handleEl) handleEl.textContent = (profile && profile.handle) || '';
    if (subEl) subEl.textContent = (profile && profile.sub) || '';
  }

  function normalizeLink(item) {
    if (!item || typeof item !== 'object') return null;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const href = typeof item.href === 'string' ? item.href.trim() : '';
    if (!label || !href) return null;

    const icon = typeof item.icon === 'string' ? item.icon.trim() : undefined;
    const note = typeof item.note === 'string' ? item.note.trim() : undefined;

    return { label, href, icon: icon || undefined, note: note || undefined };
  }

  function renderLinktree() {
    const mount = document.getElementById('linktree');
    if (!mount) return;

    const data = getData();
    renderProfile(data.profile);

    mount.innerHTML = '';

    for (const raw of data.links) {
      const item = normalizeLink(raw);
      if (!item) continue;

      const li = createElement('li');

      const a = createElement('a', 'lt-link', {
        href: item.href,
        target: '_blank',
        rel: 'noopener noreferrer',
      });

      if (item.icon) {
        const img = createElement('img', 'lt-icon', { src: item.icon, alt: '' });
        img.loading = 'lazy';
        img.decoding = 'async';
        a.appendChild(img);
      }

      const label = createElement('span', 'lt-label');
      label.textContent = item.label;
      a.appendChild(label);

      if (item.note) {
        const note = createElement('span', 'lt-note');
        note.textContent = ` — ${item.note}`;
        a.appendChild(note);
      }

      li.appendChild(a);
      mount.appendChild(li);
    }

    // Prevent resizing into pointless blank space when everything fits.
    requestAnimationFrame(updateAutoMaxSize);

    // In XP desktop embed mode, ask the parent to clamp the Internet window's resize.
    requestAnimationFrame(sendEmbedMaxSize);
  }

  function updateAutoMaxSize() {
    try {
      if (window.__LT_EMBED) return;
      const wrap = document.querySelector('.lt-wrap');
      const win = document.querySelector('.lt-window');
      if (!wrap || !win) return;

      // Compute required height for current content.
      const needed = Math.ceil(win.scrollHeight);
      const viewportLimit = Math.max(240, window.innerHeight - 24);
      const maxH = Math.min(viewportLimit, Math.max(needed, 240));

      wrap.style.maxHeight = `${maxH}px`;

      const currentH = wrap.getBoundingClientRect().height;
      if (needed > 0 && currentH - needed > 24) {
        wrap.style.height = `${Math.min(maxH, needed)}px`;
      }
    } catch {
      // ignore
    }
  }

  function sendEmbedMaxSize() {
    try {
      if (!window.__LT_EMBED) return;

      const titlebar = document.querySelector('.lt-titlebar');
      const profile = document.querySelector('.lt-profile');
      const group = document.querySelector('.lt-group');
      const panel = document.querySelector('.lt-links-panel');
      const list = document.getElementById('linktree');
      if (!panel || !list) return;

      const titleH = titlebar ? titlebar.getBoundingClientRect().height : 0;
      const profileH = profile ? profile.getBoundingClientRect().height : 0;
      const groupHBase = group ? group.getBoundingClientRect().height - panel.getBoundingClientRect().height : 0;

      const firstLi = list.querySelector('li');
      const rowH = firstLi ? firstLi.getBoundingClientRect().height : 28;
      const rows = list.children ? list.children.length : 0;
      const listH = Math.ceil(rowH * rows);

      // Some breathing room for paddings/gaps.
      const extra = 28;
      const maxClientH = Math.ceil(titleH + profileH + groupHBase + listH + extra);

      // Width: keep current iframe width (prevents accidental huge widening).
      const maxClientW = Math.ceil(document.documentElement.clientWidth);

      parent.postMessage(
        {
          type: 'internet-set-max-size',
          maxClientH,
          maxClientW,
        },
        '*'
      );
    } catch {
      // ignore
    }
  }

  document.addEventListener('DOMContentLoaded', renderLinktree);

  window.addEventListener('resize', () => requestAnimationFrame(updateAutoMaxSize));

  // Expose for debugging / future dynamic updates.
  window.r3d1Linktree = {
    getData,
    setData,
    renderLinktree,
  };
})();
