import { gridSizeFromScore } from "./difficulty";
import {
  generateBaseShape,
  generatePatternGrid,
  applyAnomaly,
  validateAnomalyVisibility,
} from "./shapeGenerator";

export function generateLevel(rng, difficulty, score = 0) {
  // Grid size driven by SCORE thresholds
  const gridSize = gridSizeFromScore(score);

  const totalCells = gridSize * gridSize;

  let attempts = 0;
  const maxAttempts = 12;

  while (attempts < maxAttempts) {
    attempts++;

    const baseSeed = generateBaseShape(rng, difficulty, score);

    // Build a patterned grid of base cells
    const baseGrid = generatePatternGrid(
      rng,
      gridSize,
      difficulty,
      score,
      baseSeed.type,
    );

    // Choose one cell to be the anomaly
    let anomalyIndex;
    if (score <= 10) {
      // Avoid corners for early levels 1-10 (score 0..10)
      const corners = [0, gridSize - 1, totalCells - gridSize, totalCells - 1];
      do {
        anomalyIndex = Math.floor(rng() * totalCells);
      } while (corners.includes(anomalyIndex));
    } else {
      anomalyIndex = Math.floor(rng() * totalCells);
    }

    // Apply anomaly to that single cell only
    const anomalyCandidate = applyAnomaly(rng, baseGrid[anomalyIndex], score);

    // Validate anomaly visibility threshold
    if (!validateAnomalyVisibility(baseGrid[anomalyIndex], anomalyCandidate)) {
      continue; // try again with a new board
    }

    // Build final grid with exactly one anomaly
    const shapes = baseGrid.map((s, i) =>
      i === anomalyIndex ? anomalyCandidate : { ...s },
    );

    // Ensure only the anomalyIndex differs from baseGrid
    let diffCount = 0;
    for (let i = 0; i < totalCells; i++) {
      if (!shapeEquals(shapes[i], baseGrid[i])) diffCount++;
      if (diffCount > 1) break;
    }

    if (diffCount !== 1) {
      // Accidental duplicates or pattern issues; retry
      continue;
    }

    return {
      gridSize,
      shapes,
      anomalyIndex,
      ruleApplied: "generated",
      difficulty,
    };
  }

  // Fallback if generation fails repeatedly
  return generateFallbackLevel(rng, gridSize);
}

function shapeEquals(a, b) {
  return (
    a.type === b.type &&
    a.variant === b.variant &&
    Math.abs((a.size || 0) - (b.size || 0)) < 1 &&
    Math.abs((a.rotation || 0) - (b.rotation || 0)) < 1 &&
    Math.abs((a.strokeWidth || 0) - (b.strokeWidth || 0)) < 1 &&
    Math.abs((a.offsetX || 0) - (b.offsetX || 0)) < 1 &&
    Math.abs((a.offsetY || 0) - (b.offsetY || 0)) < 1
  );
}

function generateFallbackLevel(rng, gridSize) {
  const totalCells = gridSize * gridSize;
  const base = {
    type: "circle",
    size: 28,
    rotation: 0,
    strokeWidth: 2,
    variant: "filled",
    animationType: "none",
  };
  const shapes = new Array(totalCells).fill(null).map(() => ({ ...base }));
  const anomalyIndex = Math.floor(totalCells / 2);
  const anomaly = { ...base, type: "square" };
  shapes[anomalyIndex] = anomaly;
  return {
    gridSize,
    shapes,
    anomalyIndex,
    ruleApplied: "fallback",
    difficulty: 1,
  };
}
