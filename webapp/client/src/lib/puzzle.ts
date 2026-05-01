// Deterministic puzzle generation — same daily for everyone (seeded by day number).
// 5 puzzles ramp from gentle warm-up (3x3, obvious) to brutal (6x6, micro-rotation).

export type ShapeType = "circle" | "square" | "triangle" | "diamond" | "hexagon";

export type Shape = {
  type: ShapeType;
  color: string;
  rotation: number;
  size: number;
};

export type Puzzle = {
  gridSize: number;
  grid: Shape[];
  anomalyIndex: number;
  difficulty: number;
  // ms allotted for this specific puzzle — earlier = more time, later = less.
  timeMs: number;
};

const SHAPES: ShapeType[] = ["circle", "square", "triangle", "diamond", "hexagon"];
const COLORS = [
  "#111111",
  "#1d4ed8",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
];

// mulberry32 — small, deterministic.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shiftColor(hex: string, amt: number, rand: () => number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.max(0, Math.min(255, r + (rand() < 0.5 ? -amt : amt)));
  const ng = Math.max(0, Math.min(255, g + (rand() < 0.5 ? -amt : amt)));
  const nb = Math.max(0, Math.min(255, b + (rand() < 0.5 ? -amt : amt)));
  return "#" + [nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// 5-puzzle blueprint — grid size, difficulty class, time budget.
// difficulty 1 = "obviously different" (shape OR full color swap)
// difficulty 2 = "different shape OR clear color shift"
// difficulty 3 = "rotation, size, or color shift — must look carefully"
// difficulty 4 = "subtle rotation, small size, narrow color shift"
// difficulty 5 = "micro-rotation, micro-color — squint mode"
const BLUEPRINT: Array<{ gridSize: number; difficulty: 1 | 2 | 3 | 4 | 5; timeMs: number }> = [
  { gridSize: 3, difficulty: 1, timeMs: 5000 },
  { gridSize: 4, difficulty: 2, timeMs: 5000 },
  { gridSize: 5, difficulty: 3, timeMs: 5500 },
  { gridSize: 5, difficulty: 4, timeMs: 6000 },
  { gridSize: 6, difficulty: 5, timeMs: 6500 },
];

export function generateDailyPuzzles(day: number): Puzzle[] {
  const rand = mulberry32(day * 1000003 + 7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const puzzles: Puzzle[] = [];

  for (let p = 0; p < BLUEPRINT.length; p++) {
    const { gridSize, difficulty, timeMs } = BLUEPRINT[p];
    const total = gridSize * gridSize;

    const baseShape = pick(SHAPES);
    const baseColor = pick(COLORS);
    const base: Shape = { type: baseShape, color: baseColor, rotation: 0, size: 1.0 };
    const anomaly: Shape = { ...base };

    // Build the variation pool by difficulty. Pick exactly ONE variation
    // (anything more makes it too easy — we want one tiny tell).
    const variations: Array<() => void> = [];

    if (difficulty === 1) {
      // Obvious — different shape or hard color swap.
      variations.push(() => {
        anomaly.type = pick(SHAPES.filter((s) => s !== baseShape));
      });
      variations.push(() => {
        anomaly.color = pick(COLORS.filter((c) => c !== baseColor));
      });
    } else if (difficulty === 2) {
      // Still clear — different shape, or visible color shift, or 45° rotation.
      variations.push(() => {
        anomaly.type = pick(SHAPES.filter((s) => s !== baseShape));
      });
      variations.push(() => {
        anomaly.color = shiftColor(baseColor, 60, rand);
      });
      variations.push(() => {
        anomaly.rotation = 35 + rand() * 20;
      });
      variations.push(() => {
        anomaly.size = 0.7 + rand() * 0.08;
      });
    } else if (difficulty === 3) {
      // Trickier — rotation 20-30°, size 0.78-0.86, color shift ~30.
      variations.push(() => {
        anomaly.rotation = 20 + rand() * 12;
      });
      variations.push(() => {
        anomaly.size = 0.78 + rand() * 0.08;
      });
      variations.push(() => {
        anomaly.color = shiftColor(baseColor, 30, rand);
      });
      // For diamond/square, half-rotation is 45° — make sure we don't accidentally hit identity.
      variations.push(() => {
        // Subtle shape-similar swap: circle↔hexagon, square↔diamond
        const SIMILAR: Record<ShapeType, ShapeType> = {
          circle: "hexagon",
          hexagon: "circle",
          square: "diamond",
          diamond: "square",
          triangle: "hexagon",
        };
        anomaly.type = SIMILAR[baseShape];
      });
    } else if (difficulty === 4) {
      // Subtle — rotation 10-18°, size 0.86-0.92, color shift ~18.
      variations.push(() => {
        anomaly.rotation = 10 + rand() * 8;
      });
      variations.push(() => {
        anomaly.size = 0.86 + rand() * 0.06;
      });
      variations.push(() => {
        anomaly.color = shiftColor(baseColor, 18, rand);
      });
      variations.push(() => {
        // Slightly bigger
        anomaly.size = 1.08 + rand() * 0.06;
      });
    } else {
      // Brutal — rotation 5-9°, size 0.92-0.96 or 1.04-1.08, color shift ~10.
      variations.push(() => {
        anomaly.rotation = 5 + rand() * 4;
      });
      variations.push(() => {
        anomaly.size = 0.92 + rand() * 0.04;
      });
      variations.push(() => {
        anomaly.size = 1.04 + rand() * 0.04;
      });
      variations.push(() => {
        anomaly.color = shiftColor(baseColor, 10, rand);
      });
    }

    pick(variations)();

    // Guard against degenerate "anomaly looks identical" — e.g. rotating a
    // circle does nothing, rotating a square 90° looks the same.
    const isIdentical =
      anomaly.type === base.type &&
      anomaly.color === base.color &&
      anomaly.size === base.size &&
      // circle is rotation-invariant; treat any rotation as identical
      (base.type === "circle" ||
        Math.abs(((anomaly.rotation - base.rotation) % 360) % 90) < 0.5);

    if (isIdentical) {
      // Force a clear color shift as a fallback.
      anomaly.color = shiftColor(baseColor, 40, rand);
    }

    // Anomaly position — only avoid corners on the very first warm-up puzzle.
    let anomalyIndex = Math.floor(rand() * total);
    if (p === 0) {
      const corners = [0, gridSize - 1, total - gridSize, total - 1];
      let guard = 0;
      while (corners.includes(anomalyIndex) && guard++ < 8) {
        anomalyIndex = Math.floor(rand() * total);
      }
    }

    const grid = new Array(total).fill(0).map(() => ({ ...base }));
    grid[anomalyIndex] = anomaly;
    puzzles.push({ gridSize, grid, anomalyIndex, difficulty, timeMs });
  }
  return puzzles;
}
