// links.data.js
// Edit THIS FILE to add/remove/update links.
// The renderer is in links.js.
//
// Fields:
// - label (required)
// - href (required)
// - icon (optional)
// - note (optional)
//
// Example:
// { label: 'YouTube', href: 'https://youtube.com/@r3d1bruh', icon: '...', note: 'videos' }

(() => {
  window.r3d1LinktreeData = {
    profile: {
      handle: '@r3d1bruh',
      sub: 'All of my active social medias are here lol',
      avatar: 'assets/pfp.webp',
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
})();
