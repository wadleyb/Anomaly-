// Difficulty helpers (grid grows by score ranges ~ levels)
// Levels 1–15 → 3×3
// Levels 16–30 → 4×4
// Levels 31–45 → 5×5
// Levels 46–60 → 6×6
// Levels 61–75 → 7×7
// Levels 76+   → 8×8 (cap)
export function gridSizeFromScore(score) {
  // score 0 corresponds to level 1
  if (score >= 75) return 8; // 76+
  if (score >= 60) return 7; // 61–75
  if (score >= 45) return 6; // 46–60
  if (score >= 30) return 5; // 31–45
  if (score >= 15) return 4; // 16–30
  return 3; // 1–15
}
