// Simple sound effects manager for ANOMALY (tap success)
// Uses expo-audio with a single lightweight player to avoid overlaps
import { createAudioPlayer } from "expo-audio";

// Replace with the provided Uploadcare MP3 URL
const TAP_SFX_URL =
  "https://1bwtnkzysd.ucarecd.net/7258b481-ec49-476d-a667-a04ecfc0909b/Minimalistic_UI_succ_11764647609122.mp3";

// Add a separate error/lose SFX URL
const ERROR_SFX_URL =
  "https://1bwtnkzysd.ucarecd.net/7583fcb1-82f0-4205-bd4c-52d825bc0bd7/ery_soft_minimal_er_11764647981982.mp3";

let _sfxPlayer = null;
let _sfxMuted = false;
let _loadedUrl = null;
let _creating = null;

async function ensureSfxPlayer() {
  if (_sfxPlayer) return _sfxPlayer;
  if (_creating) return _creating;
  _creating = (async () => {
    const p = createAudioPlayer("");
    p.loop = false;
    p.muted = _sfxMuted;
    _sfxPlayer = p;
    return p;
  })();
  try {
    return await _creating;
  } finally {
    _creating = null;
  }
}

export async function setSfxMuted(muted) {
  _sfxMuted = !!muted;
  if (_sfxPlayer) _sfxPlayer.muted = _sfxMuted;
}

export async function playTapSfx() {
  try {
    const p = await ensureSfxPlayer();
    if (!p) return;

    // If already loaded, restart quickly
    if (_loadedUrl === TAP_SFX_URL) {
      try {
        p.pause();
      } catch {}
      try {
        p.seekTo(0);
      } catch {}
      p.muted = _sfxMuted;
      try {
        await p.play();
      } catch {}
      return;
    }

    // Otherwise, load/replace and play
    try {
      await p.replace(TAP_SFX_URL);
      _loadedUrl = TAP_SFX_URL;
      p.loop = false;
      p.muted = _sfxMuted;
      await p.play();
    } catch (e) {
      console.error("SFX replace/play failed", e);
    }
  } catch (e) {
    console.error("SFX playTapSfx error", e);
  }
}

// New: play error/lose sound
export async function playErrorSfx() {
  try {
    const p = await ensureSfxPlayer();
    if (!p) return;

    if (_loadedUrl === ERROR_SFX_URL) {
      try {
        p.pause();
      } catch {}
      try {
        p.seekTo(0);
      } catch {}
      p.muted = _sfxMuted;
      try {
        await p.play();
      } catch {}
      return;
    }

    try {
      await p.replace(ERROR_SFX_URL);
      _loadedUrl = ERROR_SFX_URL;
      p.loop = false;
      p.muted = _sfxMuted;
      await p.play();
    } catch (e) {
      console.error("SFX error replace/play failed", e);
    }
  } catch (e) {
    console.error("SFX playErrorSfx error", e);
  }
}

export async function destroySfx() {
  if (_sfxPlayer) {
    try {
      await _sfxPlayer.pause();
      _sfxPlayer.remove();
    } catch {}
    _sfxPlayer = null;
    _loadedUrl = null;
  }
}
