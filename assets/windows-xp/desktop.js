let time = document.querySelector(".time")
time.innerHTML = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())
time.setAttribute("title", new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()))

let timeSetter = setInterval(() => {
    time.innerHTML = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())
    time.setAttribute("title", new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()))
}, 60000);

document.querySelector(".desktop").onclick = function () {
    document.querySelectorAll(".icon").forEach((e) => {
        e.classList.remove("selected")
    })
}

document.querySelectorAll(".icon").forEach((icon) => {
    icon.onclick = function () {
        setTimeout(() => {
            document.querySelectorAll(".icon").forEach((e) => {
                e.classList.remove("selected")
            })
            this.classList.add("selected")
        }, 1);
    }
})

document.querySelector(".max").onclick = function () {
    document.querySelector(".window").classList.toggle("maximized")
}

document.querySelector(".min").onclick = function () {
    document.querySelector(".readme").classList.toggle("active")
    document.querySelector(".window").classList.toggle("minimized")
}

document.querySelector(".readme").onclick = function () {
    document.querySelector(".readme").classList.toggle("active")
    document.querySelector(".window").classList.toggle("minimized")
}

document.querySelector(".cls").onclick = function () {
    document.querySelector(".readme").style.display = "none"
    document.querySelector(".window").style.display = "none"
}

document.querySelector(".faisal-akhtar").ondblclick = function () {
    setTimeout( ()=> { this.classList.remove("selected") }, 2 )
    window.open("https://www.facebook.com/ridwanpradhan", "_blank")
}

document.querySelector(".internet").ondblclick = function () {
    setTimeout( ()=> { this.classList.remove("selected") }, 2 )
    openInternet()
}

document.querySelector(".my-computer").ondblclick = function () {
    setTimeout( ()=> { this.classList.remove("selected") }, 2 )
    window.open("https://steamcommunity.com/id/r3d1bruh", "_blank")
}

document.querySelector(".my-network").ondblclick = function () {
    setTimeout( ()=> { this.classList.remove("selected") }, 2 )
    window.open("https://discord.com/users/r3d1bruh", "_blank")
}

document.querySelector(".note-pad").ondblclick = function () {
    setTimeout( ()=> { this.classList.remove("selected") }, 2 )
    document.querySelector(".readme").style.display = "initial"
    document.querySelector(".window").style.display = "initial"
    document.querySelector(".readme").classList.add("active")
    document.querySelector(".window").classList.remove("minimized")
}

document.querySelector("textarea").value = "Hello!\n\nFeatures:\n- Desktop icons are clickable. Double click them to open my links.\n- The time in the system tray matches your system time.\n- This window is draggable, closable, minimizable and maximizable.\n- The opened tabs in the taskbar also open links.\n\nTips:\n- Open 'Internet' to view my full link hub.\n- 'My Computer' opens my Steam profile.\n- 'My Network' opens my Discord profile.\n"


// --- Internet window (Linktree) ---
const internetWindow = document.querySelector(".internet-window")
const internetTab = document.querySelector(".internet-tab")
const internetMinBtn = document.querySelector(".internet-min")
const internetMaxBtn = document.querySelector(".internet-max")
const internetCloseBtn = document.querySelector(".internet-cls")

// --- Audio window (Winamp theme) ---
const audioWindow = document.querySelector(".audio-window")
const audioTab = document.querySelector(".audio-tab")
const audioMinBtn = document.querySelector(".audio-min")
const audioMaxBtn = document.querySelector(".audio-max")
const audioCloseBtn = document.querySelector(".audio-cls")
const audioClient = audioWindow ? audioWindow.querySelector(".audio-client") : null

const AUDIO_MANIFEST_URL = "assets/playlist/manifest.json"
const AUDIO_FALLBACK_PLAYLIST = ["assets/playlist/bm.mp3"]

let audioPlaylist = []
let audioLastTrack = null
let audioThemeEl = null
let audioMediaEl = null
let audioInited = false

let topZ = 2

function bringToFront(win) {
    topZ += 1
    win.style.zIndex = String(topZ)
}

function setTabActive(active) {
    if (!internetTab) return
    if (active) internetTab.classList.add("active")
    else internetTab.classList.remove("active")
}

function openInternet() {
    if (!internetWindow) return
    const wasHidden =
        internetWindow.style.display === "none" || window.getComputedStyle(internetWindow).display === "none"
    internetWindow.style.display = "initial"
    internetWindow.classList.remove("minimized")
    setTabActive(true)
    bringToFront(internetWindow)

    if (wasHidden) {
        centerWindowToWorkArea(internetWindow)
    }
}

function setAudioTabActive(active) {
    setTaskbarTabActive(audioTab, active)
}

function normalizeAudioTrackPath(track) {
    if (!track) return null
    const t = String(track).trim()
    if (!t) return null
    return t.startsWith("assets/playlist/") ? t : `assets/playlist/${t}`
}

async function loadAudioManifest() {
    try {
        const res = await fetch(AUDIO_MANIFEST_URL, { cache: "no-cache" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Manifest JSON is not an array")

        const tracks = data.map(normalizeAudioTrackPath).filter(Boolean)
        audioPlaylist = tracks.length ? tracks : [...AUDIO_FALLBACK_PLAYLIST]
    } catch (e) {
        console.warn("Failed to load audio playlist manifest:", e)
        audioPlaylist = [...AUDIO_FALLBACK_PLAYLIST]
    }
}

function pickRandomAudioTrack() {
    if (!audioPlaylist.length) return null
    if (audioPlaylist.length === 1) return audioPlaylist[0]

    let track = null
    for (let i = 0; i < 6; i++) {
        track = audioPlaylist[Math.floor(Math.random() * audioPlaylist.length)]
        if (track !== audioLastTrack) break
    }
    return track
}

function setAudioTrack(track) {
    if (!audioMediaEl) return
    if (!track) return
    audioLastTrack = track
    audioMediaEl.src = track

    // Attempt to reflect the track name in the theme (best-effort).
    try {
        const name = track.split("/").pop() || "Audio"
        if (audioThemeEl) audioThemeEl.setAttribute("media-title", name)
    } catch {
        // ignore
    }
}

async function ensureAudioPlayer() {
    if (!audioWindow || !audioClient) return

    if (!audioInited) {
        audioClient.innerHTML = ""

        audioThemeEl = document.createElement("media-theme-winamp")
        audioThemeEl.style.display = "block"
        audioThemeEl.style.width = "275px"
        audioThemeEl.style.height = "260px"

        audioMediaEl = document.createElement("audio")
        audioMediaEl.slot = "media"
        audioMediaEl.preload = "metadata"
        audioMediaEl.playsInline = true

        audioMediaEl.addEventListener("ended", async () => {
            if (!audioPlaylist.length) await loadAudioManifest()
            const next = pickRandomAudioTrack()
            if (!next) return
            setAudioTrack(next)
            try {
                await audioMediaEl.play()
            } catch {
                // ignore autoplay failures
            }
        })

        audioThemeEl.appendChild(audioMediaEl)
        audioClient.appendChild(audioThemeEl)
        audioInited = true
    }

    if (!audioPlaylist.length) await loadAudioManifest()
    if (audioMediaEl && !audioMediaEl.src) {
        const initial = pickRandomAudioTrack() || audioPlaylist[0]
        if (initial) setAudioTrack(initial)
    }
}

async function openAudio() {
    if (!audioWindow) return
    audioWindow.style.display = "initial"
    audioWindow.classList.remove("minimized")
    setAudioTabActive(true)
    bringToFront(audioWindow)
    await ensureAudioPlayer()
    clampWindowToWorkArea(audioWindow)
}

function toggleAudioMinimize() {
    if (!audioWindow) return
    if (audioWindow.style.display === "none") {
        // If closed, first click opens it.
        openAudio()
        return
    }
    toggleMinimize(audioWindow, audioTab)
}

function closeAudio() {
    if (!audioWindow) return
    try {
        if (audioMediaEl) audioMediaEl.pause()
    } catch {
        // ignore
    }
    audioWindow.style.display = "none"
    audioWindow.classList.remove("minimized")
    audioWindow.classList.remove("maximized")
    setAudioTabActive(false)
}

function toggleInternetMinimize() {
    if (!internetWindow) return
    if (internetWindow.style.display === "none") {
        openInternet()
        return
    }
    internetWindow.classList.toggle("minimized")
    const isMin = internetWindow.classList.contains("minimized")
    setTabActive(!isMin)
    if (!isMin) bringToFront(internetWindow)
}

function closeInternet() {
    if (!internetWindow) return
    internetWindow.style.display = "none"
    internetWindow.classList.remove("minimized")
    internetWindow.classList.remove("maximized")
    setTabActive(false)
}

function toggleInternetMaximize() {
    if (!internetWindow) return
    internetWindow.classList.toggle("maximized")
    bringToFront(internetWindow)
}

if (internetTab) {
    internetTab.onclick = function () {
        toggleInternetMinimize()
    }
}

if (internetMinBtn) {
    internetMinBtn.onclick = function () {
        toggleInternetMinimize()
    }
}

if (internetMaxBtn) {
    internetMaxBtn.onclick = function () {
        toggleInternetMaximize()
    }
}

if (internetCloseBtn) {
    internetCloseBtn.onclick = function () {
        closeInternet()
    }
}

// Allow the embedded Internet iframe (links.html?embed=1) to control the window.
let internetIframeDrag = null
window.addEventListener("message", (evt) => {
    const data = evt && evt.data
    if (!data || typeof data !== "object") return

    if (data.type === "internet-close") {
        closeInternet()
        return
    }

    if (data.type === "internet-minimize") {
        toggleInternetMinimize()
        return
    }

    if (data.type === "internet-maximize") {
        toggleInternetMaximize()
        return
    }

    if (data.type === "internet-drag-start") {
        if (!internetWindow) return
        if (internetWindow.classList.contains("minimized")) {
            internetWindow.classList.remove("minimized")
            setTabActive(true)
        }
        bringToFront(internetWindow)
        normalizeWindow(internetWindow)

        const frameEl = internetWindow.querySelector(".internet-frame")
        const frameRect = frameEl ? frameEl.getBoundingClientRect() : null
        const winRect = internetWindow.getBoundingClientRect()

        const localX = typeof data.x === "number" ? data.x : 0
        const localY = typeof data.y === "number" ? data.y : 0
        const globalX = (frameRect ? frameRect.left : 0) + localX
        const globalY = (frameRect ? frameRect.top : 0) + localY

        internetIframeDrag = {
            frameEl,
            lastLocalX: localX,
            lastLocalY: localY,
            grabOffsetX: globalX - winRect.left,
            grabOffsetY: globalY - winRect.top,
            rafPending: false,
        }
        return
    }

    if (data.type === "internet-drag-move") {
        if (!internetWindow) return
        if (internetWindow.classList.contains("maximized")) return

        if (!internetIframeDrag) {
            // If we missed start, approximate a start at current window position.
            normalizeWindow(internetWindow)
            const winRect = internetWindow.getBoundingClientRect()
            internetIframeDrag = {
                iframeLeft: 0,
                iframeTop: 0,
                lastClientX: winRect.left,
                lastClientY: winRect.top,
                grabOffsetX: 0,
                grabOffsetY: 0,
                width: winRect.width,
                height: winRect.height,
                area: getWorkArea(),
                rafPending: false,
            }
        }

        const localX = typeof data.x === "number" ? data.x : 0
        const localY = typeof data.y === "number" ? data.y : 0
        if (!Number.isFinite(localX) || !Number.isFinite(localY)) return

        internetIframeDrag.lastLocalX = localX
        internetIframeDrag.lastLocalY = localY

        if (!internetIframeDrag.rafPending) {
            internetIframeDrag.rafPending = true
            requestAnimationFrame(() => {
                if (!internetWindow || !internetIframeDrag) return
                internetIframeDrag.rafPending = false
                if (internetWindow.classList.contains("maximized")) return

                // Recompute iframe rect each frame so the global cursor coords stay correct
                // as the window moves (this is the key to "sticking" to the cursor).
                const frameRect = internetIframeDrag.frameEl
                    ? internetIframeDrag.frameEl.getBoundingClientRect()
                    : null
                const globalX = (frameRect ? frameRect.left : 0) + internetIframeDrag.lastLocalX
                const globalY = (frameRect ? frameRect.top : 0) + internetIframeDrag.lastLocalY

                const winRect = internetWindow.getBoundingClientRect()
                const area = getWorkArea()

                const desiredLeft = globalX - internetIframeDrag.grabOffsetX
                const desiredTop = globalY - internetIframeDrag.grabOffsetY

                const clampedLeft = clamp(desiredLeft, area.left, area.right - winRect.width)
                const clampedTop = clamp(desiredTop, area.top, area.bottom - winRect.height)

                // Match Notepad logic: don't round; let sub-pixel positioning be smooth.
                internetWindow.style.left = clampedLeft + "px"
                internetWindow.style.top = clampedTop + "px"
            })
        }
        return
    }

    if (data.type === "internet-drag-end") {
        internetIframeDrag = null
        return
    }

    if (data.type === "internet-set-max-size") {
        if (!internetWindow) return
        const maxClientH = typeof data.maxClientH === "number" ? data.maxClientH : null
        const maxClientW = typeof data.maxClientW === "number" ? data.maxClientW : null

        // The Internet window's titlebar is ~25px (see desktop.css calc(100% - 25px)).
        const CHROME_H = 25
        const CHROME_W = 4

        if (Number.isFinite(maxClientH) && maxClientH > 0) {
            internetWindow.style.maxHeight = Math.round(maxClientH + CHROME_H) + "px"
        }
        if (Number.isFinite(maxClientW) && maxClientW > 0) {
            internetWindow.style.maxWidth = Math.round(maxClientW + CHROME_W) + "px"
        }
        clampWindowToWorkArea(internetWindow)
    }
})

// Focus windows on click
document.querySelectorAll(".window").forEach((w) => {
    w.addEventListener("pointerdown", () => bringToFront(w))
})

// --- Window system (smooth drag + reliable maximize/minimize) ---
const TASKBAR = document.querySelector(".taskbar")
const EDGE_MARGIN = 8

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n))
}

function getWorkArea() {
    const maxW = window.innerWidth
    const maxH = window.innerHeight
    const taskbarH = TASKBAR ? TASKBAR.getBoundingClientRect().height : 0
    return {
        left: EDGE_MARGIN,
        top: EDGE_MARGIN,
        right: maxW - EDGE_MARGIN,
        bottom: maxH - taskbarH - EDGE_MARGIN,
        width: maxW,
        height: maxH - taskbarH,
    }
}

function normalizeWindow(win) {
    if (!win || win.dataset.__normalized === "1") return

    // If hidden (e.g., Internet window at load), defer normalization until shown.
    const display = window.getComputedStyle(win).display
    if (display === "none") return

    const rect = win.getBoundingClientRect()

    // Defensive: if the rect is empty, don't lock in a bogus position.
    if (rect.width < 2 || rect.height < 2) return

    // Convert the initial "centered with translate(-50%, -50%)" layout into explicit px
    // positioning so dragging + maximize doesn't fight CSS transforms.
    win.style.transform = "none"
    win.style.left = rect.left + "px"
    win.style.top = rect.top + "px"
    win.dataset.__normalized = "1"
}

function clampWindowToWorkArea(win) {
    if (!win) return
    if (win.classList.contains("maximized")) return

    normalizeWindow(win)

    const rect = win.getBoundingClientRect()
    const area = getWorkArea()

    const nextLeft = clamp(rect.left, area.left, area.right - rect.width)
    const nextTop = clamp(rect.top, area.top, area.bottom - rect.height)

    if (Math.abs(nextLeft - rect.left) > 0.5) win.style.left = nextLeft + "px"
    if (Math.abs(nextTop - rect.top) > 0.5) win.style.top = nextTop + "px"
}

function centerWindowToWorkArea(win) {
    if (!win) return
    if (win.classList.contains("maximized")) win.classList.remove("maximized")

    // Ensure we are using explicit px positioning.
    win.style.transform = "none"
    win.dataset.__normalized = "1"

    const rect = win.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return

    const area = getWorkArea()
    const areaW = area.right - area.left
    const areaH = area.bottom - area.top

    const left = area.left + (areaW - rect.width) / 2
    const top = area.top + (areaH - rect.height) / 2

    win.style.left = Math.round(left) + "px"
    win.style.top = Math.round(top) + "px"
    clampWindowToWorkArea(win)
}

function setTaskbarTabActive(tabEl, active) {
    if (!tabEl) return
    if (active) tabEl.classList.add("active")
    else tabEl.classList.remove("active")
}

function toggleMinimize(win, tabEl) {
    if (!win) return
    const willMinimize = !win.classList.contains("minimized")
    win.classList.toggle("minimized")
    setTaskbarTabActive(tabEl, !willMinimize)
    if (!willMinimize) {
        bringToFront(win)
        clampWindowToWorkArea(win)
    }
}

function toggleMaximize(win) {
    if (!win) return
    if (win.classList.contains("minimized")) {
        win.classList.remove("minimized")
    }

    const isMax = win.classList.contains("maximized")
    if (!isMax) {
        normalizeWindow(win)
        // Save current position so restore works after dragging.
        win.dataset.restoreLeft = win.style.left || ""
        win.dataset.restoreTop = win.style.top || ""

        // Inline width/height would override the maximized CSS.
        win.dataset.restoreWidth = win.style.width || ""
        win.dataset.restoreHeight = win.style.height || ""
        win.dataset.restoreMaxWidth = win.style.maxWidth || ""
        win.dataset.restoreMaxHeight = win.style.maxHeight || ""
        win.style.width = ""
        win.style.height = ""
        win.style.maxWidth = ""
        win.style.maxHeight = ""

        // Let the `.window.maximized` CSS take over positioning.
        win.style.left = ""
        win.style.top = ""
        win.classList.add("maximized")
        bringToFront(win)
        return
    }

    win.classList.remove("maximized")
    normalizeWindow(win)

    if (typeof win.dataset.restoreWidth === "string") win.style.width = win.dataset.restoreWidth
    if (typeof win.dataset.restoreHeight === "string") win.style.height = win.dataset.restoreHeight
    if (typeof win.dataset.restoreMaxWidth === "string") win.style.maxWidth = win.dataset.restoreMaxWidth
    if (typeof win.dataset.restoreMaxHeight === "string") win.style.maxHeight = win.dataset.restoreMaxHeight

    if (typeof win.dataset.restoreLeft === "string" && win.dataset.restoreLeft.length) {
        win.style.left = win.dataset.restoreLeft
    }
    if (typeof win.dataset.restoreTop === "string" && win.dataset.restoreTop.length) {
        win.style.top = win.dataset.restoreTop
    }
    bringToFront(win)
    clampWindowToWorkArea(win)
}

function wireResize(win) {
    if (!win) return
    if (win.querySelector(".resize-handle")) return

    const handleDirs = ["n", "e", "s", "w", "ne", "nw", "se", "sw"]
    handleDirs.forEach((dir) => {
        const h = document.createElement("div")
        h.className = "resize-handle"
        h.dataset.dir = dir
        h.setAttribute("aria-hidden", "true")
        win.appendChild(h)
    })

    const MIN_W = 260
    const MIN_H = 180

    let resizing = false
    let activeDir = "se"
    let pointerId = null
    let startClientX = 0
    let startClientY = 0
    let startRect = null
    let lastClientX = 0
    let lastClientY = 0
    let rafPending = false

    function applyResize() {
        rafPending = false
        if (!resizing || !startRect) return
        if (win.classList.contains("maximized")) return

        const dx = lastClientX - startClientX
        const dy = lastClientY - startClientY

        const area = getWorkArea()

        const startLeft = startRect.left
        const startTop = startRect.top
        const startW = startRect.width
        const startH = startRect.height
        const startRight = startLeft + startW
        const startBottom = startTop + startH

        let nextLeft = startLeft
        let nextTop = startTop
        let nextW = startW
        let nextH = startH

        if (activeDir.includes("e")) nextW = startW + dx
        if (activeDir.includes("s")) nextH = startH + dy
        if (activeDir.includes("w")) {
            nextW = startW - dx
            nextLeft = startLeft + dx
        }
        if (activeDir.includes("n")) {
            nextH = startH - dy
            nextTop = startTop + dy
        }

        // Min size (keep the opposite edge anchored).
        if (nextW < MIN_W) {
            nextW = MIN_W
            if (activeDir.includes("w")) nextLeft = startRight - nextW
        }
        if (nextH < MIN_H) {
            nextH = MIN_H
            if (activeDir.includes("n")) nextTop = startBottom - nextH
        }

        // Work area constraints.
        if (nextLeft < area.left) {
            if (activeDir.includes("w")) {
                nextW = startRight - area.left
                nextLeft = area.left
            } else {
                nextLeft = area.left
            }
        }
        if (nextTop < area.top) {
            if (activeDir.includes("n")) {
                nextH = startBottom - area.top
                nextTop = area.top
            } else {
                nextTop = area.top
            }
        }

        if (nextLeft + nextW > area.right) {
            if (activeDir.includes("e")) {
                nextW = area.right - nextLeft
            } else if (activeDir.includes("w")) {
                nextLeft = area.right - nextW
            }
        }
        if (nextTop + nextH > area.bottom) {
            if (activeDir.includes("s")) {
                nextH = area.bottom - nextTop
            } else if (activeDir.includes("n")) {
                nextTop = area.bottom - nextH
            }
        }

        // Respect CSS max-width/max-height if present.
        try {
            const cs = window.getComputedStyle(win)
            const maxW = Number.parseFloat(cs.maxWidth)
            const maxH = Number.parseFloat(cs.maxHeight)

            if (Number.isFinite(maxW) && maxW > 0 && nextW > maxW) {
                nextW = maxW
                if (activeDir.includes("w")) nextLeft = startRight - nextW
            }
            if (Number.isFinite(maxH) && maxH > 0 && nextH > maxH) {
                nextH = maxH
                if (activeDir.includes("n")) nextTop = startBottom - nextH
            }
        } catch {
            // ignore
        }

        // Remove the default CSS max constraints once the user manually resizes.
        win.style.maxWidth = "none"
        win.style.maxHeight = "none"

        win.style.left = Math.round(nextLeft) + "px"
        win.style.top = Math.round(nextTop) + "px"
        win.style.width = Math.round(nextW) + "px"
        win.style.height = Math.round(nextH) + "px"
    }

    function onPointerDown(e) {
        if (e.button !== 0) return
        if (win.classList.contains("maximized")) return
        const dir = e.target && e.target.dataset ? e.target.dataset.dir : null
        if (!dir) return

        bringToFront(win)
        normalizeWindow(win)

        // Ensure the window is in-bounds before starting.
        clampWindowToWorkArea(win)

        resizing = true
        activeDir = dir
        pointerId = e.pointerId
        startClientX = e.clientX
        startClientY = e.clientY
        lastClientX = e.clientX
        lastClientY = e.clientY
        startRect = win.getBoundingClientRect()

        try {
            e.target.setPointerCapture(pointerId)
        } catch {
            // ignore
        }
        e.preventDefault()
        e.stopPropagation()
    }

    function onPointerMove(e) {
        if (!resizing) return
        lastClientX = e.clientX
        lastClientY = e.clientY
        if (!rafPending) {
            rafPending = true
            requestAnimationFrame(applyResize)
        }
        e.preventDefault()
        e.stopPropagation()
    }

    function endResize(e) {
        if (!resizing) return
        resizing = false
        startRect = null
        if (pointerId != null && e && e.target) {
            try {
                e.target.releasePointerCapture(pointerId)
            } catch {
                // ignore
            }
        }
        pointerId = null
    }

    win.addEventListener("pointerdown", onPointerDown)
    win.addEventListener("pointermove", onPointerMove)
    win.addEventListener("pointerup", endResize)
    win.addEventListener("pointercancel", endResize)
}

function wireWindow(win, handle) {
    if (!win || !handle) return
    // Only normalize if it's actually visible; some windows start hidden.
    normalizeWindow(win)

    let dragging = false
    let pointerId = null
    let grabOffsetX = 0
    let grabOffsetY = 0
    let lastClientX = 0
    let lastClientY = 0
    let rafPending = false

    function applyMove() {
        rafPending = false
        if (!dragging) return
        if (win.classList.contains("maximized")) return

        const rect = win.getBoundingClientRect()
        const area = getWorkArea()

        const desiredLeft = lastClientX - grabOffsetX
        const desiredTop = lastClientY - grabOffsetY

        const clampedLeft = clamp(desiredLeft, area.left, area.right - rect.width)
        const clampedTop = clamp(desiredTop, area.top, area.bottom - rect.height)

        win.style.left = clampedLeft + "px"
        win.style.top = clampedTop + "px"
    }

    handle.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return
        if (win.classList.contains("maximized")) return
        if (e.target && e.target.closest && e.target.closest(".controls")) return

        bringToFront(win)
        normalizeWindow(win)

        const rect = win.getBoundingClientRect()
        dragging = true
        pointerId = e.pointerId
        grabOffsetX = e.clientX - rect.left
        grabOffsetY = e.clientY - rect.top
        lastClientX = e.clientX
        lastClientY = e.clientY

        try {
            handle.setPointerCapture(pointerId)
        } catch {
            // ignore
        }
        e.preventDefault()
    })

    handle.addEventListener("pointermove", (e) => {
        if (!dragging) return
        lastClientX = e.clientX
        lastClientY = e.clientY
        if (!rafPending) {
            rafPending = true
            requestAnimationFrame(applyMove)
        }
        e.preventDefault()
    })

    function endDrag() {
        if (!dragging) return
        dragging = false
        if (pointerId != null) {
            try {
                handle.releasePointerCapture(pointerId)
            } catch {
                // ignore
            }
        }
        pointerId = null
    }

    handle.addEventListener("pointerup", endDrag)
    handle.addEventListener("pointercancel", endDrag)

    // Double-click title bar to toggle maximize.
    handle.addEventListener("dblclick", (e) => {
        if (e.target && e.target.closest && e.target.closest(".controls")) return
        toggleMaximize(win)
    })
}

// Wire the two desktop windows.
wireWindow(document.querySelector(".window"), document.querySelector(".window .title-bar"))
wireWindow(internetWindow, document.querySelector(".internet-title-bar"))
wireWindow(audioWindow, document.querySelector(".audio-title-bar"))

wireResize(document.querySelector(".window"))
wireResize(internetWindow)
wireResize(audioWindow)

// Patch existing button behaviors to use the new logic.
const readmeWindow = document.querySelector(".window")
const readmeTab = document.querySelector(".readme")

const readmeMaxBtn = document.querySelector(".max")
const readmeMinBtn = document.querySelector(".min")

if (readmeMaxBtn && readmeWindow) {
    readmeMaxBtn.onclick = function () {
        toggleMaximize(readmeWindow)
    }
}

if (readmeMinBtn && readmeWindow) {
    readmeMinBtn.onclick = function () {
        toggleMinimize(readmeWindow, readmeTab)
    }
}

if (readmeTab && readmeWindow) {
    readmeTab.onclick = function () {
        toggleMinimize(readmeWindow, readmeTab)
    }
}

if (internetMaxBtn && internetWindow) {
    internetMaxBtn.onclick = function () {
        toggleMaximize(internetWindow)
    }
}

if (internetMinBtn && internetWindow) {
    internetMinBtn.onclick = function () {
        toggleMinimize(internetWindow, internetTab)
    }
}

if (internetTab && internetWindow) {
    internetTab.onclick = function () {
        // If closed, keep the existing openInternet behavior.
        if (internetWindow.style.display === "none") {
            openInternet()
            return
        }
        toggleMinimize(internetWindow, internetTab)
    }
}

if (audioMaxBtn && audioWindow) {
    audioMaxBtn.onclick = function () {
        toggleMaximize(audioWindow)
    }
}

if (audioMinBtn && audioWindow) {
    audioMinBtn.onclick = function () {
        toggleAudioMinimize()
    }
}

if (audioTab && audioWindow) {
    audioTab.onclick = function () {
        toggleAudioMinimize()
    }
}

if (audioCloseBtn && audioWindow) {
    audioCloseBtn.onclick = function () {
        closeAudio()
    }
}

// Keep windows on-screen when viewport changes.
window.addEventListener("resize", () => {
    document.querySelectorAll(".window").forEach((w) => clampWindowToWorkArea(w))
})

// --- Startup state ---
// Start with Linktree (Internet) open, and keep Notepad closed.
try {
    const readmeWindowBoot = document.querySelector(".window")
    const readmeTabBoot = document.querySelector(".readme")
    if (readmeWindowBoot) readmeWindowBoot.style.display = "none"
    if (readmeTabBoot) readmeTabBoot.style.display = "none"
} catch {
    // ignore
}

openInternet()