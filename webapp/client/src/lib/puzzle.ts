// Deterministic puzzle generation — same daily for everyone (seeded by day number).
// Ported from anomaly-web/game.js shapeSVG/generateLevel.

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

// Generate the 5 puzzles for a given day. Deterministic.
export function generateDailyPuzzles(day: number): Puzzle[] {
  const rand = mulberry32(day * 1000003 + 7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const puzzles: Puzzle[] = [];
  // Difficulty curve over the 5: 2, 3, 3, 4, 5
  const curve = [2, 3, 3, 4, 5];

  for (let p = 0; p < 5; p++) {
    const difficulty = curve[p];
    const gridSize = difficulty <= 2 ? 3 : difficulty <= 4 ? 4 : 5;
    const total = gridSize * gridSize;

    const baseShape = pick(SHAPES);
    const baseColor = pick(COLORS);
    const base: Shape = { type: baseShape, color: baseColor, rotation: 0, size: 1.0 };
    const anomaly: Shape = { ...base };

    if (difficulty <= 2) {
      const variations = [
        () => {
          anomaly.type = pick(SHAPES.filter((s) => s !== baseShape));
        },
        () => {
          anomaly.color = pick(COLORS.filter((c) => c !== baseColor));
        },
      ];
      pick(variations)();
    } else if (difficulty <= 4) {
      const variations = [
        () => {
          anomaly.type = pick(SHAPES.filter((s) => s !== baseShape));
        },
        () => {
          anomaly.rotation = 25 + rand() * 25;
        },
        () => {
          anomaly.size = 0.78 + rand() * 0.08;
        },
        () => {
          anomaly.color = shiftColor(baseColor, 35, rand);
        },
      ];
      pick(variations)();
    } else {
      const variations = [
        () => {
          anomaly.rotation = 8 + rand() * 10;
        },
        () => {
          anomaly.size = 0.86 + rand() * 0.06;
        },
        () => {
          anomaly.color = shiftColor(baseColor, 18, rand);
        },
      ];
      pick(variations)();
    }

    let anomalyIndex = Math.floor(rand() * total);
    // Avoid corners on the easy ones — friendlier first puzzle.
    if (p === 0) {
      const corners = [0, gridSize - 1, total - gridSize, total - 1];
      let guard = 0;
      while (corners.includes(anomalyIndex) && guard++ < 8) {
        anomalyIndex = Math.floor(rand() * total);
      }
    }

    const grid = new Array(total).fill(0).map(() => ({ ...base }));
    grid[anomalyIndex] = anomaly;
    puzzles.push({ gridSize, grid, anomalyIndex, difficulty });
  }
  return puzzles;
}

// SVG markup for a single shape — returned as a JSX-ready string-free element.
export function shapeSVG(shape: Shape): { d: string; type: string; color: string; rotation: number; size: number } {
  return { d: "", type: shape.type, color: shape.color, rotation: shape.rotation, size: shape.size };
}
