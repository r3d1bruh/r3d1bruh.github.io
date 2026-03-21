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
      avatar: 'assets/pfp.webp',
    },
    links: [
      {
        label: 'Facebook',
        href: 'https://www.facebook.com/r3d1bruh',
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
    const leftMount = document.getElementById('linktree-left');
    const rightMount = document.getElementById('linktree-right');
    const legacyMount = document.getElementById('linktree');
    if (!leftMount && !rightMount && !legacyMount) return;

    const data = getData();
    renderProfile(data.profile);

    if (leftMount) leftMount.innerHTML = '';
    if (rightMount) rightMount.innerHTML = '';
    if (legacyMount) legacyMount.innerHTML = '';

    const items = [];
    for (const raw of data.links) {
      const item = normalizeLink(raw);
      if (item) items.push(item);
    }

    function renderYahooRow(item, mount) {
      const tr = createElement('tr');
      const td = createElement('td');

      const bullet = createElement('img', 'lt-yahoo-bullet', {
        src: 'temp/Yahoo!_files/sm.gif',
        alt: '',
      });
      bullet.loading = 'lazy';
      bullet.decoding = 'async';

      const a = createElement('a', 'lt-yahoo-link', {
        href: item.href,
        target: '_blank',
        rel: 'noopener noreferrer',
      });
      a.textContent = item.label;

      td.appendChild(bullet);
      td.appendChild(document.createTextNode(' '));
      td.appendChild(a);

      if (item.note) {
        const note = createElement('span', 'lt-yahoo-note');
        note.textContent = ` — ${item.note}`;
        td.appendChild(note);
      }

      tr.appendChild(td);
      mount.appendChild(tr);
    }

    // Prefer the new Yahoo-style two-column layout when present.
    if (leftMount && rightMount) {
      const mid = Math.ceil(items.length / 2);
      const leftItems = items.slice(0, mid);
      const rightItems = items.slice(mid);

      for (const item of leftItems) renderYahooRow(item, leftMount);
      for (const item of rightItems) renderYahooRow(item, rightMount);
    } else if (legacyMount) {
      // Fallback: render into the old single mount if the page is older.
      for (const item of items) {
        const li = createElement('li');
        const a = createElement('a', '', {
          href: item.href,
          target: '_blank',
          rel: 'noopener noreferrer',
        });
        a.textContent = item.label;
        li.appendChild(a);
        legacyMount.appendChild(li);
      }
    }

  }

  document.addEventListener('DOMContentLoaded', () => {
    renderLinktree();
  });

  // Expose for debugging / future dynamic updates.
  window.r3d1Linktree = {
    getData,
    setData,
    renderLinktree,
  };
})();
