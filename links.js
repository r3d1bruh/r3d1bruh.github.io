// links.js
// Edit the LINKS array to add/remove buttons without touching index.html.
// Each item supports: { label, href, icon, note }

(() => {
  /** @type {{label: string, href: string, icon?: string, note?: string}[]} */
  const LINKS = [
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
  ];

  function createElement(tag, className, attrs = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;
      node.setAttribute(key, String(value));
    }
    return node;
  }

  function renderLinktree() {
    const mount = document.getElementById('linktree');
    if (!mount) return;

    mount.innerHTML = '';

    for (const item of LINKS) {
      const a = createElement('a', 'lt-link', {
        href: item.href,
        target: '_blank',
        rel: 'noopener noreferrer',
      });

      const left = createElement('div', 'lt-link-left');
      if (item.icon) {
        const img = createElement('img', 'lt-icon', { src: item.icon, alt: '' });
        img.loading = 'lazy';
        img.decoding = 'async';
        left.appendChild(img);
      }

      const textWrap = createElement('div', 'lt-text');
      const label = createElement('div', 'lt-label');
      label.textContent = item.label;
      textWrap.appendChild(label);

      if (item.note) {
        const note = createElement('div', 'lt-note');
        note.textContent = item.note;
        textWrap.appendChild(note);
      }

      left.appendChild(textWrap);
      a.appendChild(left);

      const right = createElement('div', 'lt-link-right');
      right.textContent = '→';
      a.appendChild(right);

      mount.appendChild(a);
    }
  }

  document.addEventListener('DOMContentLoaded', renderLinktree);

  // Expose for debugging / future dynamic updates.
  window.r3d1Linktree = { LINKS, renderLinktree };
})();
