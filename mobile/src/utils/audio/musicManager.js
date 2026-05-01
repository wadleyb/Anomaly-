// Global music manager for ANOMALY
// Uses expo-audio to ensure a single player instance and no overlaps
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { MUSIC_TRACKS } from "./musicLibrary";

// Internal state (module singleton)
let _initialized = false;
let _player = null; // single player
let _muted = false;
let _isPlaying = false;
let _currentTrackIndex = -1;
let _order = []; // shuffled order of playable tracks
let _endPoll = null; // interval for end-of-track detection

// Concurrency control to prevent double players/double loads
let _ensurePlayerPromise = null; // mutex for creating the player
let _loadPromise = Promise.resolve(); // serialize load/replace/play operations

// Helper: shuffle array immutably
function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build playlist purely from direct MP3 URIs
async function buildResolvedPlaylist() {
  const out = [];
  for (const t of MUSIC_TRACKS) {
    if (t?.uri && t.uri.endsWith(".mp3")) {
      out.push({ ...t, resolved: t.uri });
    }
  }
  return out;
}

async function ensurePlayer() {
  if (_player) return _player;
  if (_ensurePlayerPromise) return _ensurePlayerPromise;
  _ensurePlayerPromise = (async () => {
    // Configure audio mode for background
    try {
      await setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        interruptionModeIOS: 1,
      });
    } catch (e) {
      console.warn("setAudioModeAsync failed", e);
    }
    const p = createAudioPlayer(""); // create empty, we'll replace source when playing
    p.loop = false;
    p.muted = _muted;
    _player = p;
    return _player;
  })();
  try {
    const created = await _ensurePlayerPromise;
    return created;
  } finally {
    _ensurePlayerPromise = null;
  }
}

function startEndPolling() {
  if (_endPoll) return;
  _endPoll = setInterval(() => {
    if (!_player) return;
    // Detect end: not playing, has progressed, and currentTime >= duration - small epsilon
    const dur = _player.duration || 0;
    if (dur > 0) {
      const ended =
        !_player.playing &&
        _player.currentTime > 0 &&
        _player.currentTime >= dur - 0.25;
      if (ended) {
        // pick next track and play
        nextTrack();
      }
    }
  }, 500);
}

function stopEndPolling() {
  if (_endPoll) {
    clearInterval(_endPoll);
    _endPoll = null;
  }
}

function enqueue(fn) {
  // chain operations so loads never overlap
  _loadPromise = _loadPromise.then(fn).catch((e) => {
    console.error("music load op failed", e);
  });
  return _loadPromise;
}

async function loadAndPlay(uri) {
  if (!uri) return;
  await ensurePlayer();
  return enqueue(async () => {
    if (!_player) return;
    // Always stop and replace to prevent overlap/double-play
    try {
      _player.pause();
    } catch {}
    try {
      _player.seekTo(0);
    } catch {}
    try {
      await _player.replace(uri);
    } catch (e) {
      console.error("replace failed", e);
      return;
    }
    _player.muted = _muted;
    _player.loop = false;
    try {
      await _player.play();
      _isPlaying = true;
    } catch (e) {
      console.error("play failed", e);
    }
  });
}

async function pickRandomIndex() {
  if (_order.length === 0) return -1;
  const idx = Math.floor(Math.random() * _order.length);
  return idx;
}

async function nextTrack() {
  if (_order.length === 0) return;
  // advance to another random index different from current
  let nextIdx = await pickRandomIndex();
  if (nextIdx === _currentTrackIndex && _order.length > 1) {
    nextIdx = (nextIdx + 1) % _order.length;
  }
  _currentTrackIndex = nextIdx;
  const track = _order[_currentTrackIndex];
  await loadAndPlay(track.resolved);
}

export async function initMusic() {
  if (_initialized) return;
  _initialized = true;

  const resolved = await buildResolvedPlaylist();
  if (!resolved.length) {
    console.warn(
      "No resolvable music tracks. Check MUSIC_TRACKS for direct MP3 URIs.",
    );
  }
  _order = shuffle(resolved);
  try {
    // Dev helper: print resolved MP3 URLs to verify
    console.log(
      "[Music] Using direct tracks:",
      resolved.map((t) => ({ id: t.id, uri: t.resolved })),
    );
  } catch {}
  // start polling for end-of-track to advance automatically
  startEndPolling();
}

export async function playMusic() {
  // If muted, set playing flag but keep paused
  if (_muted) {
    _isPlaying = true; // logical play
    return;
  }
  await initMusic();
  if (!_order.length) return;

  // If a track is already loaded and playing, no-op
  if (_player && _player.playing) return;

  // If current index invalid, choose one at random
  if (_currentTrackIndex < 0 || _currentTrackIndex >= _order.length) {
    _currentTrackIndex = await pickRandomIndex();
    if (_currentTrackIndex < 0) return;
  }

  const track = _order[_currentTrackIndex];
  await loadAndPlay(track.resolved);
}

export async function pauseMusic() {
  _isPlaying = false;
  await enqueue(async () => {
    if (_player) {
      try {
        await _player.pause();
      } catch {}
    }
  });
}

export async function toggleMusic() {
  if (_muted) {
    await setMuteState(false);
    await playMusic();
  } else {
    await setMuteState(true);
    await pauseMusic();
  }
}

export async function setMuteState(value) {
  _muted = !!value;
  if (_player) {
    _player.muted = _muted;
  }
}

export function isMuted() {
  return _muted;
}

export async function destroyMusic() {
  stopEndPolling();
  await enqueue(async () => {
    if (_player) {
      try {
        await _player.pause();
        _player.remove();
      } catch {}
      _player = null;
    }
    _isPlaying = false;
    _currentTrackIndex = -1;
    _order = [];
  });
}
