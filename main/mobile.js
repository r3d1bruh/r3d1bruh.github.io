(function() {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(max-width:760px)');
  if (!mq.matches) return;

  const bannerGrid = document.querySelector('.banner-grid');
  const webpagesList = document.getElementById('webpages-list');
  if (!bannerGrid || !webpagesList) return;

  // create a mobile-only socials container below the profile name
  if (!document.getElementById('mobile-socials')) {
    const sidebar = document.querySelector('.sidebar');
    const profileName = sidebar ? sidebar.querySelector('.profile-name') : null;
    const mobileSocials = document.createElement('div');
    mobileSocials.id = 'mobile-socials';
    if (profileName && profileName.parentNode) {
      profileName.parentNode.insertBefore(mobileSocials, profileName.nextSibling);
    } else if (sidebar) {
      sidebar.appendChild(mobileSocials);
    }
  }
  const dest = document.getElementById('mobile-socials');

  // For each anchor in bannerGrid, clone it into the mobile-socials container as a tile with a label
  bannerGrid.querySelectorAll('a').forEach(a => {
    const img = a.querySelector('img');
    const title = a.getAttribute('title') || (img && img.getAttribute('alt')) || a.textContent.trim() || 'link';
    const tile = document.createElement('a');
    tile.className = 'mobile-social-tile';
    tile.href = a.href || '#';
    tile.setAttribute('aria-label', title);
    tile.target = '_blank';
    tile.rel = 'noopener noreferrer';

    const icon = document.createElement('img');
    if (img && img.src) {
      icon.src = img.src;
      icon.loading = 'lazy';
    } else {
      icon.alt = '';
    }
    icon.alt = title;

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = title;

    tile.appendChild(icon);
    tile.appendChild(label);
    dest.appendChild(tile);
  });

  // Hide original bannerGrid (desktop will still show it because this script runs only on mobile)
  bannerGrid.style.display = 'none';
})();
