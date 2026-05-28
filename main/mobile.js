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
    const sidebarBrand = sidebar ? sidebar.querySelector('.sidebar-brand') : null;
    const mobileSocials = document.createElement('div');
    mobileSocials.id = 'mobile-socials';
    if (sidebarBrand && sidebarBrand.parentNode) {
      sidebarBrand.parentNode.insertBefore(mobileSocials, sidebarBrand.nextSibling);
    } else if (sidebar) {
      sidebar.appendChild(mobileSocials);
    }
  }
  const dest = document.getElementById('mobile-socials');

  const contentTitle = document.querySelector('.content-area > .section-title');
  if (contentTitle && !document.getElementById('mobile-link-exchange-title')) {
    contentTitle.id = 'mobile-link-exchange-title';
    const sidebar = document.querySelector('.sidebar');
    const sidebarBrand = sidebar ? sidebar.querySelector('.sidebar-brand') : null;

    contentTitle.innerHTML = '<span class="dropdown-triangle dropdown-triangle-left">▸</span><span class="dropdown-label">LINK EXCHANGE</span><span class="dropdown-triangle dropdown-triangle-right">▸</span>';

    if (sidebarBrand && sidebarBrand.parentNode) {
      sidebarBrand.parentNode.insertBefore(contentTitle, dest);
    }
  }

  const title = document.getElementById('mobile-link-exchange-title');
  const originalNav = document.querySelector('.sidebar > .stats-box > .sidebar-nav:first-of-type');

  function setLinkExchangeTitleLabel(label) {
    if (!title) return;
    const labelNode = title.querySelector('.dropdown-label');
    if (labelNode) {
      labelNode.textContent = label;
    }
  }

  function setMobileSocialsVisible(visible) {
    if (!dest) return;
    dest.classList.toggle('mobile-socials-hidden', !visible);
  }

  function setMobileHeaderCollapsed(collapsed) {
    document.body.classList.toggle('mobile-header-collapsed', collapsed);
  }

  if (title && originalNav && !document.getElementById('mobile-nav-dropdown')) {
    originalNav.style.display = 'none';
    setMobileSocialsVisible(true);
    setMobileHeaderCollapsed(false);

    const dropdown = document.createElement('div');
    dropdown.id = 'mobile-nav-dropdown';

    const navClone = originalNav.cloneNode(true);
    navClone.style.display = 'flex';

    const navButtons = navClone.querySelectorAll('button');
    navButtons.forEach((button) => {
      if (button.id) {
        button.dataset.paneTarget = button.id;
        button.id = `mobile-${button.id}`;
      }
    });

      function setMobileNavActive(paneTarget) {
        const mobileBtns = document.querySelectorAll('#mobile-nav-dropdown .sidebar-nav button');
        mobileBtns.forEach(b => {
          if (b.dataset.paneTarget === paneTarget) b.classList.add('active');
          else b.classList.remove('active');
        });
      }

    navButtons.forEach((button) => {
      if (button.dataset.paneTarget === 'nav-pc-specs') {
        button.textContent = 'PC CONFIG';
      }
    });

    navButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (typeof window.showPane === 'function') {
          if (button.dataset.paneTarget === 'nav-link-exchange') {
            window.showPane('link');
            setLinkExchangeTitleLabel('LINK EXCHANGE');
            setMobileSocialsVisible(true);
            setMobileHeaderCollapsed(false);
            setMobileNavActive(button.dataset.paneTarget);
          } else if (button.dataset.paneTarget === 'nav-pc-specs') {
            window.showPane('pc');
            setMobileSocialsVisible(false);
            setMobileHeaderCollapsed(true);
            if (typeof window.runNeofetchIfNeeded === 'function') {
              window.runNeofetchIfNeeded();
            }
            setTimeout(() => setLinkExchangeTitleLabel('PC CONFIG'), 160);
            setMobileNavActive(button.dataset.paneTarget);
          } else if (button.dataset.paneTarget === 'nav-game-stats') {
            window.showPane('game-stats');
            setMobileSocialsVisible(false);
            setMobileHeaderCollapsed(true);
            setTimeout(() => setLinkExchangeTitleLabel('VIDEO GAME STATS'), 160);
            setMobileNavActive(button.dataset.paneTarget);
          }
        }

        title.classList.remove('open');
        dropdown.classList.remove('open');
      });
    });

    dropdown.appendChild(navClone);

    title.parentNode.insertBefore(dropdown, title.nextSibling);

    title.addEventListener('click', () => {
      const isOpen = title.classList.toggle('open');
      dropdown.classList.toggle('open', isOpen);
    });
  }

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
