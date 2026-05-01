import { create } from "zustand";
import * as Haptics from "expo-haptics";
import { mulberry32 } from "./random";
import { generateLevel } from "./levelGenerator";
// Add SFX for correct anomaly taps
import { playTapSfx, playErrorSfx, setSfxMuted } from "../audio/sfxManager";
// ADD: word level generator
import { generateWordLevel } from "./wordGenerator";

let rng = mulberry32(Date.now());

export const useGameStore = create((set, get) => ({
  score: 0,
  bestScore: 0,
  difficulty: 1,
  timer: 0,
  maxTimer: 5000, // 5 seconds in ms
  grid: [],
  anomalyIndex: null,
  mode: "FREEPLAY",
  lives: 3,
  maxLives: 3,
  isGameOver: false,
  isPlaying: false,
  currentLevel: null,
  // Combo system — chain correct taps to build a multiplier
  combo: 0,
  topCombo: 0,
  // Animation feedback state
  isShowingFeedback: false,
  wrongTapIndex: null,
  feedbackTimeoutId: null,
  // Settings
  soundEnabled: true,
  hapticsEnabled: true,
  // Track last 3 used word categories to avoid repeats
  lastThreeWordCategories: [],
  toggleSound: () =>
    set((s) => {
      const next = !s.soundEnabled;
      // keep SFX mute state in sync
      setSfxMuted(!next);
      return { soundEnabled: next };
    }),
  toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),

  startNewLevel: () => {
    const { difficulty, mode, score, lastThreeWordCategories } = get();
    rng = mulberry32(Date.now() + Math.random() * 1000); // Re-seed for variety

    // CHANGED: support WORDS mode generation
    let level;
    if (mode === "WORDS") {
      level = generateWordLevel(rng, score, lastThreeWordCategories);
      // Track last 3 categories for better variety
      if (level.baseCategoryKey) {
        const updated = [
          level.baseCategoryKey,
          ...lastThreeWordCategories,
        ].slice(0, 3);
        set({ lastThreeWordCategories: updated });
      }
    } else {
      level = generateLevel(rng, difficulty, score);
    }

    // Timer logic
    let baseTimer = 5000; // 5 seconds base
    if (mode === "SPEED") baseTimer = 5000; // 5 seconds for speed mode (init-only)
    if (mode === "SURVIVAL") baseTimer = 6500; // slightly generous

    // effective grid size for timing (support word grids that are rectangular)
    const effectiveGrid = level.gridSize
      ? level.gridSize
      : Math.max(level.rows || 3, level.cols || 3);

    // Reduce timer as grid grows and difficulty increases (not for SPEED; it counts down globally)
    const gridPenalty = mode === "SPEED" ? 0 : (effectiveGrid - 3) * 250; // each extra column shaves 250ms
    const difficultyPenalty =
      mode === "SPEED" ? 0 : Math.max(0, (get().difficulty - 1) * 150);
    const timerValue = Math.max(
      1500,
      baseTimer - gridPenalty - difficultyPenalty,
    );

    // For SPEED mode, do NOT reset the timer every level. Only set it on the first level of the run.
    let nextTimer = timerValue;
    let nextMaxTimer = timerValue;
    if (mode === "SPEED") {
      const { currentLevel, timer, maxTimer } = get();
      if (!currentLevel) {
        // First level of a SPEED run: initialize to 5s
        nextTimer = 5000;
        nextMaxTimer = 5000;
      } else {
        // Subsequent levels: preserve the carried-over timer and maxTimer
        nextTimer = timer;
        nextMaxTimer = maxTimer;
      }
    }

    set({
      currentLevel: level,
      grid: level.shapes || [],
      anomalyIndex:
        typeof level.anomalyIndex === "number" ? level.anomalyIndex : null,
      timer: nextTimer,
      maxTimer: nextMaxTimer,
      isPlaying: true,
      isGameOver: false,
      isShowingFeedback: false,
      wrongTapIndex: null,
    });
  },

  handleTap: (index) => {
    const {
      anomalyIndex,
      mode,
      timer,
      score,
      difficulty,
      lives,
      hapticsEnabled,
      isShowingFeedback,
      maxTimer,
      soundEnabled,
    } = get();

    // Don't allow taps during feedback animation
    if (isShowingFeedback) return;

    if (index === anomalyIndex) {
      // Correct!
      if (soundEnabled) {
        // fire-and-forget; errors are internally caught
        playTapSfx();
      }
      if (hapticsEnabled) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }

      // Combo: increment for each correct, reset on wrong/timeout
      const prevCombo = get().combo || 0;
      const newCombo = prevCombo + 1;
      const comboMult = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
      set({ combo: newCombo, topCombo: Math.max(get().topCombo || 0, newCombo) });
      const newScore = score + comboMult;
      let newDifficulty = difficulty;

      // Increase difficulty every 5 correct answers
      if (newScore % 5 === 0) {
        newDifficulty = difficulty + 1;
      }

      let newTimer = timer;
      if (mode === "SPEED") {
        // Add +0.5 seconds, cap at 2 minutes
        newTimer = Math.min(timer + 500, 120000);
      }

      set({
        score: newScore,
        difficulty: newDifficulty,
        timer: newTimer,
        maxTimer: mode === "SPEED" ? Math.max(maxTimer, newTimer) : maxTimer,
      });

      // Generate next level
      get().startNewLevel();
    } else {
      // Wrong!
      if (soundEnabled) {
        // play error sound on wrong tap
        playErrorSfx();
      }
      if (hapticsEnabled) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
      }

      // Show feedback animation before ending game
      set({
        isShowingFeedback: true,
        wrongTapIndex: index,
        isPlaying: false, // Stop timer during feedback
      });

      // Clear any existing timeout
      const { feedbackTimeoutId } = get();
      if (feedbackTimeoutId) {
        clearTimeout(feedbackTimeoutId);
      }

      // Show feedback for 1.5 seconds, then proceed with game logic
      const timeoutId = setTimeout(() => {
        // wrong tap: reset combo
        set({ combo: 0 });
        const { mode, lives, score, bestScore } = get();

        // TREAT WORDS like FREEPLAY for end condition unless in SURVIVAL
        if (mode === "FREEPLAY" || mode === "SPEED" || mode === "WORDS") {
          set({
            isGameOver: true,
            isShowingFeedback: false,
            wrongTapIndex: null,
            bestScore: Math.max(bestScore, score),
            feedbackTimeoutId: null,
          });
        } else if (mode === "SURVIVAL") {
          const newLives = lives - 1;
          if (newLives <= 0) {
            set({
              lives: 0,
              isGameOver: true,
              isShowingFeedback: false,
              wrongTapIndex: null,
              bestScore: Math.max(bestScore, score),
              feedbackTimeoutId: null,
            });
          } else {
            set({
              lives: newLives,
              isShowingFeedback: false,
              wrongTapIndex: null,
              feedbackTimeoutId: null,
            });
            get().startNewLevel();
          }
        }
      }, 1500); // 1.5 seconds

      set({ feedbackTimeoutId: timeoutId });
    }
  },

  tickTimer: (deltaMs) => {
    const {
      timer,
      isPlaying,
      score,
      mode,
      lives,
      isShowingFeedback,
      soundEnabled,
    } = get();
    if (!isPlaying || isShowingFeedback) return; // Don't tick during feedback

    const newTimer = Math.max(0, timer - deltaMs);

    if (newTimer <= 0) {
      // Time's up
      if (mode === "SURVIVAL") {
        const newLives = lives - 1;
        if (soundEnabled) {
          // treat timeout as wrong
          playErrorSfx();
        }
        if (newLives <= 0) {
          const { bestScore } = get();
          set({
            timer: 0,
            lives: 0,
            isGameOver: true,
            isPlaying: false,
            bestScore: Math.max(bestScore, score),
          });
        } else {
          set({ lives: newLives });
          // start a new level with fresh timer
          get().startNewLevel();
        }
      } else {
        // FREEPLAY, SPEED, and WORDS: show feedback highlight on the correct cell before ending
        // Stop the timer and show the green highlight for the anomaly
        // Clear any existing feedback timeout first
        const { feedbackTimeoutId } = get();
        if (feedbackTimeoutId) {
          clearTimeout(feedbackTimeoutId);
        }

        if (soundEnabled) {
          playErrorSfx();
        }

        set({
          timer: 0,
          isPlaying: false,
          isShowingFeedback: true,
          wrongTapIndex: null, // we didn't tap; just show the correct cell (green)
        });

        // Show feedback for 1.5 seconds before game over
        const timeoutId = setTimeout(() => {
          const { bestScore, score: finalScore } = get();
          set({
            isGameOver: true,
            isShowingFeedback: false,
            wrongTapIndex: null,
            bestScore: Math.max(bestScore, finalScore),
            feedbackTimeoutId: null,
          });
        }, 1500);

        set({ feedbackTimeoutId: timeoutId });
      }
    } else {
      set({ timer: newTimer });
    }
  },

  resetForMode: (mode) => {
    // Clear any pending feedback timeout
    const { feedbackTimeoutId } = get();
    if (feedbackTimeoutId) {
      clearTimeout(feedbackTimeoutId);
    }

    const lives = mode === "SURVIVAL" ? 3 : 1;
    set({
      score: 0,
      difficulty: 1,
      timer: 0,
      grid: [],
      anomalyIndex: null,
      mode,
      lives,
      maxLives: lives,
      isGameOver: false,
      isPlaying: false,
      currentLevel: null,
      isShowingFeedback: false,
      wrongTapIndex: null,
      feedbackTimeoutId: null,
      lastThreeWordCategories: [],
    });

    get().startNewLevel();
  },

  reset: () => {
    // Clear any pending feedback timeout
    const { feedbackTimeoutId } = get();
    if (feedbackTimeoutId) {
      clearTimeout(feedbackTimeoutId);
    }

    set({
      score: 0,
      difficulty: 1,
      timer: 0,
      grid: [],
      anomalyIndex: null,
      mode: "FREEPLAY",
      lives: 1,
      maxLives: 1,
      isGameOver: false,
      isPlaying: false,
      currentLevel: null,
      isShowingFeedback: false,
      wrongTapIndex: null,
      feedbackTimeoutId: null,
      lastThreeWordCategories: [],
    });
  },
}));
