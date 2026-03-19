// Theme manager scaffold (supports future random themes)

(function () {
  const STORAGE_KEY = 'lt-theme';

  const themes = [
    {
      name: 'xp',
      label: 'Windows XP',
    },
  ];

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveTheme(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore
    }
  }

  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    saveTheme(name);
  }

  function pickRandomTheme() {
    if (themes.length === 0) return null;
    const idx = Math.floor(Math.random() * themes.length);
    return themes[idx].name;
  }

  function init() {
    const saved = getSavedTheme();
    const initial = saved || 'xp';
    applyTheme(initial);

    window.themeManager = {
      themes: themes.map((t) => ({ ...t })),
      applyTheme,
      pickRandomTheme,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
