import {
  CATEGORY_POOLS,
  TIER_BUCKETS,
  getCategoryByKey,
} from "./wordCategories";

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tierFromScore(score) {
  if (score >= 35) return "EXTREME";
  if (score >= 25) return "HARD";
  if (score >= 15) return "MEDIUM";
  return "EASY";
}

// Define allowed grid sizes per tier in order of preference
const GRID_SIZES = {
  EASY: [
    [2, 3],
    [2, 2],
  ],
  MEDIUM: [
    [4, 3],
    [3, 3],
  ],
  HARD: [
    [4, 3],
    [3, 3],
  ],
  EXTREME: [
    [4, 4],
    [4, 3],
  ],
};

function chooseBaseCategory(rng, tier, lastThreeKeys = [], minCount) {
  // prefer categories in the tier bucket; fall back to all if needed
  const prefKeys = TIER_BUCKETS[tier] || CATEGORY_POOLS.map((c) => c.key);
  let pool = prefKeys
    .map(getCategoryByKey)
    .filter(Boolean)
    // ensure enough words to fill base cells
    .filter((c) => (c.words?.length || 0) >= Math.max(minCount, 1));

  // if too restrictive, allow any category that satisfies minCount
  if (pool.length === 0) {
    pool = CATEGORY_POOLS.filter(
      (c) => (c.words?.length || 0) >= Math.max(minCount, 1),
    );
  }

  // avoid repeating the last 3 categories if possible
  if (lastThreeKeys.length > 0 && pool.length > lastThreeKeys.length) {
    const filtered = pool.filter((c) => !lastThreeKeys.includes(c.key));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  // as a last resort, fall back to any category
  if (pool.length === 0) pool = CATEGORY_POOLS.slice();

  return pick(pool, rng);
}

function chooseAnomalySource(rng, tier, baseKey, baseWords) {
  // Build candidate list by tier similarity strategy
  let candidates = [];
  if (tier === "EASY") {
    candidates = CATEGORY_POOLS.filter((c) => c.key !== baseKey);
  } else if (tier === "MEDIUM") {
    const keys = (TIER_BUCKETS.MEDIUM || []).filter((k) => k !== baseKey);
    candidates = (keys.length ? keys : CATEGORY_POOLS.map((c) => c.key))
      .map(getCategoryByKey)
      .filter(Boolean);
  } else if (tier === "HARD" || tier === "EXTREME") {
    const related = {
      birds: "animals",
      vegetables: "fruits",
      appliances: "objects",
      fabrics: "clothing",
      professions: "occupations",
      occupations: "professions",
    };
    const relKey = related[baseKey];
    if (relKey) {
      const relCat = getCategoryByKey(relKey);
      if (relCat) candidates.push(relCat);
    }
    const keys = [
      ...(TIER_BUCKETS.HARD || []),
      ...(TIER_BUCKETS.EXTREME || []),
    ].filter((k) => k !== baseKey);
    candidates.push(...keys.map(getCategoryByKey).filter(Boolean));
    if (candidates.length === 0) candidates = CATEGORY_POOLS.slice();
  } else {
    candidates = CATEGORY_POOLS.slice();
  }

  // Ensure the anomaly category has at least one word not in baseWords (trimmed comparison)
  const baseSetTrimmed = new Set(
    (baseWords || []).map((w) => String(w).trim()),
  );
  const filtered = candidates.filter((c) =>
    (c.words || []).some((w) => !baseSetTrimmed.has(String(w).trim())),
  );
  return filtered.length ? pick(filtered, rng) : pick(candidates, rng);
}

export function generateWordLevel(rng, score, lastThreeCategoryKeys = []) {
  const tier = tierFromScore(score);

  // We'll pick a base category first to ensure we can size the grid without running out of words
  const preferredSizes = GRID_SIZES[tier] || [[2, 2]];
  // start with the largest preferred size and find a category that can support it
  let rows = preferredSizes[0][0];
  let cols = preferredSizes[0][1];
  let need = rows * cols;

  // Try to find a base category that supports the largest preferred size
  let baseCategory = chooseBaseCategory(
    rng,
    tier,
    lastThreeCategoryKeys,
    need - 1,
  );

  // If chosen baseCategory can't fill the largest size, pick the largest size that fits this category
  const sizesThatFit = preferredSizes.filter(
    ([r, c]) => (baseCategory.words?.length || 0) >= r * c - 1,
  );
  const chosenSize = sizesThatFit.length
    ? sizesThatFit[0] // prefer the largest option for smoother difficulty progression
    : preferredSizes[preferredSizes.length - 1];
  rows = chosenSize[0];
  cols = chosenSize[1];
  need = rows * cols;

  // Re-validate base category for this need; if it still doesn't fit, re-choose with the smaller requirement
  if ((baseCategory.words?.length || 0) < need - 1) {
    baseCategory = chooseBaseCategory(
      rng,
      tier,
      lastThreeCategoryKeys,
      need - 1,
    );
  }

  // ensure enough words for base: take unique words up to need-1
  const shuffledBase = shuffle(baseCategory.words || [], rng);
  const baseWords = Array.from(new Set(shuffledBase)).slice(
    0,
    Math.max(need - 1, 1),
  );

  // If still not enough (edge case), fallback to repeating items to fill (duplicates allowed as last resort)
  while (baseWords.length < need - 1 && shuffledBase.length > 0) {
    const next = shuffledBase[baseWords.length % shuffledBase.length];
    baseWords.push(next);
  }

  const anomalyCategory = chooseAnomalySource(
    rng,
    tier,
    baseCategory.key,
    baseWords,
  );

  // Pick an anomaly not in the base set (compare trimmed)
  const baseSetTrimmed = new Set(baseWords.map((w) => String(w).trim()));
  let anomaly = pick(anomalyCategory.words, rng);
  let guard = 0;
  while (
    (baseSetTrimmed.has(String(anomaly).trim()) ||
      anomalyCategory.key === baseCategory.key) &&
    guard++ < 40
  ) {
    anomaly = pick(anomalyCategory.words, rng);
  }

  // assemble and shuffle words placing one anomaly
  const words = baseWords.concat([anomaly]);
  const shuffled = shuffle(words, rng);
  const anomalyIndex = shuffled.indexOf(anomaly);

  return {
    levelType: "WORD",
    rows,
    cols,
    words: shuffled,
    anomalyIndex,
    baseCategoryKey: baseCategory.key,
    anomalyCategoryKey: anomalyCategory.key,
    ruleApplied: tier,
  };
}
