// Journey + Daily + Boosters meta-progression store
// Persists to AsyncStorage. Independent of the core gameplay store.
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@anomaly/journey_v1";

// Soundtrack unlock thresholds (must match musicLibrary order)
export const TRACK_UNLOCKS = [
  { trackIndex: 0, unlockAt: 0 },
  { trackIndex: 1, unlockAt: 0 },
  { trackIndex: 2, unlockAt: 3 },
  { trackIndex: 3, unlockAt: 6 },
  { trackIndex: 4, unlockAt: 10 },
  { trackIndex: 5, unlockAt: 15 },
  { trackIndex: 6, unlockAt: 20 },
  { trackIndex: 7, unlockAt: 25 },
  { trackIndex: 8, unlockAt: 30 },
  { trackIndex: 9, unlockAt: 40 },
  { trackIndex: 10, unlockAt: 50 },
];

export const TOTAL_LEVELS = 500;
export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 20 * 60 * 1000; // 1 life every 20 min

// Day number used for Daily — days since launch date
const LAUNCH_DATE = new Date(2026, 3, 1);
export function dailyDayNumber() {
  const now = new Date();
  return Math.floor((now - LAUNCH_DATE) / 86400000) + 1;
}
export function dailyDateString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function dailySeed() {
  return dailyDayNumber() * 9973 + 17;
}

const initialState = {
  // progression
  journeyProgress: 0,        // highest level completed
  journeyStars: {},          // { [level]: 0..3 }
  // lives + regen
  lives: MAX_LIVES,
  lastLifeTs: Date.now(),
  // daily
  dailyDoneDate: null,       // "YYYY-MM-DD" of last completed daily
  dailyStreak: 0,
  lastDailyResults: [],      // [ "🟩"|"🟥", ... ] for share card
  // boosters
  boosters: { reveal: 2, slow: 1, skip: 1 },
  // top combo (for bragging rights)
  topCombo: 0,
  hydrated: false,
};

export const useJourneyStore = create((set, get) => ({
  ...initialState,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...initialState, ...parsed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch (e) {
      set({ hydrated: true });
    }
    get().regenLives();
  },

  persist: async () => {
    try {
      const { hydrated, ...rest } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch (e) {}
  },

  regenLives: () => {
    const { lives, lastLifeTs } = get();
    if (lives >= MAX_LIVES) {
      set({ lastLifeTs: Date.now() });
      return;
    }
    const now = Date.now();
    const elapsed = now - lastLifeTs;
    const earned = Math.floor(elapsed / LIFE_REGEN_MS);
    if (earned > 0) {
      const newLives = Math.min(MAX_LIVES, lives + earned);
      set({ lives: newLives, lastLifeTs: lastLifeTs + earned * LIFE_REGEN_MS });
      get().persist();
    }
  },

  consumeLife: () => {
    const { lives } = get();
    if (lives <= 0) return false;
    set({ lives: lives - 1, lastLifeTs: lives === MAX_LIVES ? Date.now() : get().lastLifeTs });
    get().persist();
    return true;
  },

  refillLives: () => {
    set({ lives: MAX_LIVES, lastLifeTs: Date.now() });
    get().persist();
  },

  msUntilNextLife: () => {
    const { lives, lastLifeTs } = get();
    if (lives >= MAX_LIVES) return 0;
    return Math.max(0, LIFE_REGEN_MS - (Date.now() - lastLifeTs));
  },

  completeJourneyLevel: (levelNumber, stars) => {
    const cur = get();
    const prevStars = cur.journeyStars[levelNumber] || 0;
    set({
      journeyProgress: Math.max(cur.journeyProgress, levelNumber),
      journeyStars: { ...cur.journeyStars, [levelNumber]: Math.max(prevStars, stars) },
    });
    // booster reward every 5 levels
    if (levelNumber % 5 === 0) {
      const b = get().boosters;
      set({ boosters: { ...b, reveal: b.reveal + 1 } });
    }
    get().persist();
  },

  failJourneyLevel: () => {
    get().consumeLife();
  },

  completeDaily: (results) => {
    const today = dailyDateString();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    })();
    const cur = get();
    const hadGreens = results.some(r => r === "🟩");
    let newStreak = cur.dailyStreak;
    if (hadGreens) {
      newStreak = cur.dailyDoneDate === yesterday ? cur.dailyStreak + 1 : 1;
    } else {
      newStreak = 0;
    }
    const b = get().boosters;
    set({
      dailyDoneDate: today,
      dailyStreak: newStreak,
      lastDailyResults: results,
      boosters: { reveal: b.reveal + 1, slow: b.slow + 1, skip: b.skip + 1 },
    });
    get().persist();
  },

  isDailyAvailable: () => {
    return get().dailyDoneDate !== dailyDateString();
  },

  useBooster: (name) => {
    const b = get().boosters;
    if ((b[name] || 0) <= 0) return false;
    set({ boosters: { ...b, [name]: b[name] - 1 } });
    get().persist();
    return true;
  },

  recordCombo: (combo) => {
    if (combo > get().topCombo) {
      set({ topCombo: combo });
      get().persist();
    }
  },

  // dev / reset
  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ ...initialState, hydrated: true });
  },
}));

export function getUnlockedTracks(progress) {
  return TRACK_UNLOCKS.filter(t => progress >= t.unlockAt).map(t => t.trackIndex);
}

export function starsForLevel(stars) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}
