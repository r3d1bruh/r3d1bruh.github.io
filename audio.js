// Audio playback system (random song from assets/playlist)
// Static sites can't list directory contents, so we load a manifest:
//   assets/playlist/manifest.json
// Example format: ["bm.mp3", "song2.mp3"]

const MANIFEST_URL = 'assets/playlist/manifest.json';
const FALLBACK_PLAYLIST = ['assets/playlist/bm.mp3'];

let playlist = [];
let lastTrack = null;
let audioEl = null;

let started = false;
let isPaused = false;

let volume = 0.7;
let uiRoot = null;
let btnPlay = null;
let volRange = null;

function ensureAudio() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = 'auto';
  audioEl.volume = volume;
  audioEl.addEventListener('ended', () => {
    playRandom();
  });
  audioEl.addEventListener('play', () => {
    isPaused = false;
    syncUI();
  });
  audioEl.addEventListener('pause', () => {
    isPaused = true;
    syncUI();
  });
  return audioEl;
}

function normalizeTrackPath(track) {
  if (!track) return null;
  const t = String(track).trim();
  if (!t) return null;
  return t.startsWith('assets/playlist/') ? t : `assets/playlist/${t}`;
}

async function loadManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Manifest JSON is not an array');

    const tracks = data.map(normalizeTrackPath).filter(Boolean);
    playlist = tracks.length ? tracks : [...FALLBACK_PLAYLIST];
  } catch (e) {
    console.warn('Failed to load playlist manifest:', e);
    playlist = [...FALLBACK_PLAYLIST];
  }
}

function pickRandomTrack() {
  if (!playlist.length) return null;
  if (playlist.length === 1) return playlist[0];

  let track = null;
  for (let i = 0; i < 5; i++) {
    track = playlist[Math.floor(Math.random() * playlist.length)];
    if (track !== lastTrack) break;
  }
  return track;
}

function stop() {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

async function playRandom() {
  const a = ensureAudio();
  if (!playlist.length) await loadManifest();

  const track = pickRandomTrack();
  if (!track) return;
  lastTrack = track;

  a.src = track;
  a.volume = volume;
  try {
    await a.play();
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

async function togglePlayPause() {
  const a = ensureAudio();

  if (!a.src) {
    await playRandom();
    return;
  }

  if (a.paused) {
    try {
      await a.play();
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  } else {
    a.pause();
  }
}

function setVolume(v) {
  const a = ensureAudio();
  volume = Math.max(0, Math.min(1, v));
  a.volume = volume;
  syncUI();
}

function svgPlay() {
  return `
    <svg viewBox="0 0 24 24" width="65" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.6v12.8c0 .7.8 1.1 1.4.7l10-6.4c.6-.4.6-1.2 0-1.6l-10-6.4c-.6-.4-1.4 0-1.4.9Z" fill="white"/>
    </svg>
  `;
}

function svgPause() {
  return `
    <svg viewBox="0 0 24 24" width="65" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 6.5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1H8c-.6 0-1-.4-1-1v-11Z" fill="white"/>
      <path d="M13 6.5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-11Z" fill="white"/>
    </svg>
  `;
}

// (removed speaker/mute button per request)

function injectStylesOnce() {
  if (document.getElementById('audio-osd-style')) return;
  const style = document.createElement('style');
  style.id = 'audio-osd-style';
  style.textContent = `
    #audio-osd {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 10002;
      height: 76px;
      width: 76px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      border-radius: 999px;
      background: transparent;
      border: 1px solid transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-sizing: border-box;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: width 560ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease, background 220ms ease, border-color 220ms ease, backdrop-filter 220ms ease;
    }

    #audio-osd.active {
      opacity: 1;
      pointer-events: auto;
    }

    #audio-osd:hover {
      width: 290px;
      background: rgba(255, 255, 255, 0.10);
      border-color: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    #audio-play {
      width: 65px;
      height: 65px;
      flex: 0 0 auto;
    }

    #audio-osd button {
      all: unset;
      display: grid;
      place-items: center;
      transition: transform 160ms ease;
      cursor: pointer;
    }

    #audio-osd button:hover {
      transform: scale(1.03);
    }

    #audio-osd .expand {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 0;
      opacity: 0;
      transition: width 560ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease;
      pointer-events: none;
      white-space: nowrap;
    }

    #audio-osd:hover .expand {
      width: 200px;
      opacity: 1;
      pointer-events: auto;
    }

    #audio-osd .expand-bg {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0;
      border-radius: 0;
      background: transparent;
    }

    #audio-volume {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      max-width: 190px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) var(--vol, 70%), rgba(255,255,255,0.25) var(--vol, 70%), rgba(255,255,255,0.25) 100%);
      outline: none;
    }

    #audio-volume::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255,255,255,0.95);
      border: 2px solid rgba(0,0,0,0.3);
    }

    #audio-volume::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255,255,255,0.95);
      border: 2px solid rgba(0,0,0,0.3);
    }
  `;
  document.head.appendChild(style);
}

function createUIOnce() {
  if (uiRoot) return;
  injectStylesOnce();

  uiRoot = document.createElement('div');
  uiRoot.id = 'audio-osd';
  uiRoot.setAttribute('aria-label', 'Audio controls');

  btnPlay = document.createElement('button');
  btnPlay.type = 'button';
  btnPlay.id = 'audio-play';
  btnPlay.setAttribute('aria-label', 'Play or pause');
  btnPlay.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await togglePlayPause();
  });

  const expand = document.createElement('div');
  expand.className = 'expand';

  const expandBg = document.createElement('div');
  expandBg.className = 'expand-bg';

  volRange = document.createElement('input');
  volRange.id = 'audio-volume';
  volRange.type = 'range';
  volRange.min = '0';
  volRange.max = '100';
  volRange.step = '1';
  volRange.value = String(Math.round(volume * 100));
  volRange.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    setVolume(val / 100);
  });

  // Keep play/pause visible always; reveal volume on hover.
  expandBg.appendChild(volRange);
  expand.appendChild(expandBg);

  uiRoot.appendChild(btnPlay);
  uiRoot.appendChild(expand);

  document.body.appendChild(uiRoot);
  syncUI();
}

function syncUI() {
  if (!btnPlay || !volRange) return;

  const a = audioEl;
  const paused = a ? a.paused : true;
  btnPlay.innerHTML = paused ? svgPlay() : svgPause();

  const percent = Math.round(volume * 100);
  volRange.value = String(percent);
  volRange.style.setProperty('--vol', `${percent}%`);
}

function showUI() {
  createUIOnce();
  uiRoot.classList.add('active');
}

// Called by overlay.js after the first click gesture.
async function startRandomPlaylistAudio() {
  if (started) return;
  started = true;

  showUI();
  ensureAudio();
  syncUI();

  await loadManifest();
  await playRandom();
}

// Expose start function for overlay.js
window.startRandomPlaylistAudio = startRandomPlaylistAudio;

document.addEventListener('DOMContentLoaded', () => {
  // Start audio on the overlay click (user gesture) for autoplay reliability.
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener(
      'click',
      () => {
        if (typeof window.startRandomPlaylistAudio === 'function') {
          window.startRandomPlaylistAudio();
        }
      },
      { once: true }
    );
  }

  // Safety: stop audio when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
});
