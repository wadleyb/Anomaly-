// Deterministic puzzle generation — same daily for everyone (seeded by day number).
// 5 puzzles, each with a guaranteed-different base shape AND base color.
// Every anomaly is provably visible (no rotated circles, no 90-deg square rotations, etc.)

export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "star"
  | "pentagon"
  | "arrow";

export type Shape = {
  type: ShapeType;
  color: string;
  rotation: number; // degrees
  size: number;     // multiplier on base 60px
};

export type Puzzle = {
  gridSize: number;
  grid: Shape[];
  anomalyIndex: number;
  difficulty: number;
};

// 8 shapes — most are rotation-asymmetric so rotation actually shows
const SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "hexagon",
  "star",
  "pentagon",
  "arrow",
];

// Shapes for which rotation is INVISIBLE — never use rotation as the
// only variation if the base is one of these, AND never produce an
// anomaly that "rotates" one of these.
const ROTATION_INVISIBLE = new Set<ShapeType>(["circle"]);

// 12 colors — balanced across the wheel
const COLORS = [
  "#111111", // ink
  "#dc2626", // red
  "#ea580c", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
  "#1d4ed8", // blue
  "#4f46e5", // indigo
  "#7c3aed", // violet
  "#c026d3", // fuchsia
  "#be185d", // pink
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle in place using a seeded RNG.
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shiftColor(hex: string, amt: number, rand: () => number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.max(0, Math.min(255, r + (rand() < 0.5 ? -amt : amt)));
  const ng = Math.max(0, Math.min(255, g + (rand() < 0.5 ? -amt : amt)));
  const nb = Math.max(0, Math.min(255, b + (rand() < 0.5 ? -amt : amt)));
  return "#" + [nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// 5-puzzle blueprint — identical structure every day, content rotates by seed.
// Difficulty 1 = obvious, 5 = brutal. Grid sizes vary so shapes feel different.
const BLUEPRINT: Array<{ gridSize: number; difficulty: 1 | 2 | 3 | 4 | 5 }> = [
  { gridSize: 3, difficulty: 1 },
  { gridSize: 4, difficulty: 2 },
  { gridSize: 5, difficulty: 3 },
  { gridSize: 5, difficulty: 4 },
  { gridSize: 6, difficulty: 5 },
];

type VariationKind =
  | "shape"        // swap to a different shape entirely
  | "color-hard"   // pick an entirely different color
  | "color-shift"  // shift HSL by some amount
  | "rotation"     // rotate by N degrees
  | "size-down"    // shrink
  | "size-up";     // grow

// Difficulty -> the numeric strength of each variation it allows.
type VariationSpec = { kind: VariationKind; magnitude: number };

function variationsFor(difficulty: 1 | 2 | 3 | 4 | 5, base: Shape): VariationSpec[] {
  const specs: VariationSpec[] = [];

  if (difficulty === 1) {
    specs.push({ kind: "shape", magnitude: 0 });
    specs.push({ kind: "color-hard", magnitude: 0 });
  } else if (difficulty === 2) {
    specs.push({ kind: "shape", magnitude: 0 });
    specs.push({ kind: "color-hard", magnitude: 0 });
    specs.push({ kind: "color-shift", magnitude: 70 });
    specs.push({ kind: "size-down", magnitude: 0.7 });
    if (!ROTATION_INVISIBLE.has(base.type))
      specs.push({ kind: "rotation", magnitude: 40 });
  } else if (difficulty === 3) {
    specs.push({ kind: "color-shift", magnitude: 40 });
    specs.push({ kind: "size-down", magnitude: 0.78 });
    specs.push({ kind: "size-up", magnitude: 1.2 });
    if (!ROTATION_INVISIBLE.has(base.type))
      specs.push({ kind: "rotation", magnitude: 22 });
  } else if (difficulty === 4) {
    specs.push({ kind: "color-shift", magnitude: 22 });
    specs.push({ kind: "size-down", magnitude: 0.86 });
    specs.push({ kind: "size-up", magnitude: 1.12 });
    if (!ROTATION_INVISIBLE.has(base.type))
      specs.push({ kind: "rotation", magnitude: 14 });
  } else {
    // Brutal but still solvable — magnitudes are small but real.
    specs.push({ kind: "color-shift", magnitude: 18 });
    specs.push({ kind: "size-down", magnitude: 0.88 });
    specs.push({ kind: "size-up", magnitude: 1.1 });
    if (!ROTATION_INVISIBLE.has(base.type))
      specs.push({ kind: "rotation", magnitude: 10 });
  }
  return specs;
}

// Apply a variation to produce the anomaly. Returns true if a *visible*
// difference was produced; returns false if the result is identical to base
// (so the caller can pick another variation).
function applyVariation(
  base: Shape,
  spec: VariationSpec,
  rand: () => number,
): Shape | null {
  const a: Shape = { ...base };
  if (spec.kind === "shape") {
    const others = SHAPES.filter((s) => s !== base.type);
    a.type = others[Math.floor(rand() * others.length)];
    return a;
  }
  if (spec.kind === "color-hard") {
    const others = COLORS.filter((c) => c !== base.color);
    a.color = others[Math.floor(rand() * others.length)];
    return a;
  }
  if (spec.kind === "color-shift") {
    a.color = shiftColor(base.color, spec.magnitude, rand);
    if (a.color.toLowerCase() === base.color.toLowerCase()) return null;
    return a;
  }
  if (spec.kind === "rotation") {
    if (ROTATION_INVISIBLE.has(base.type)) return null;
    const sign = rand() < 0.5 ? -1 : 1;
    a.rotation = base.rotation + sign * spec.magnitude;
    // Square/diamond have 90° rotational symmetry — keep magnitude away from 90/180/270
    if ((base.type === "square" || base.type === "diamond")) {
      const mod = ((a.rotation % 90) + 90) % 90;
      if (mod < 3 || mod > 87) return null;
    }
    return a;
  }
  if (spec.kind === "size-down") {
    a.size = spec.magnitude;
    return a;
  }
  if (spec.kind === "size-up") {
    a.size = spec.magnitude;
    return a;
  }
  return null;
}

export function generateDailyPuzzles(day: number): Puzzle[] {
  const rand = mulberry32(day * 1000003 + 7);

  // FORCE VARIETY: shuffle the shape and color lists so each puzzle picks
  // an unused base shape AND base color. With 8 shapes and 12 colors,
  // we have plenty of headroom for 5 puzzles.
  const shapeOrder = shuffle(SHAPES, rand);
  const colorOrder = shuffle(COLORS, rand);

  const puzzles: Puzzle[] = [];

  for (let p = 0; p < BLUEPRINT.length; p++) {
    const { gridSize, difficulty } = BLUEPRINT[p];
    const total = gridSize * gridSize;

    const baseShape = shapeOrder[p % shapeOrder.length];
    const baseColor = colorOrder[p % colorOrder.length];
    const base: Shape = {
      type: baseShape,
      color: baseColor,
      rotation: 0,
      size: 1.0,
    };

    // Try variations until one produces a *visible* change.
    let anomaly: Shape | null = null;
    const candidates = shuffle(variationsFor(difficulty, base), rand);
    for (const spec of candidates) {
      const result = applyVariation(base, spec, rand);
      if (result) {
        anomaly = result;
        break;
      }
    }
    // Bullet-proof fallback: a hard color swap is always visible.
    if (!anomaly) {
      const others = COLORS.filter((c) => c !== baseColor);
      anomaly = {
        ...base,
        color: others[Math.floor(rand() * others.length)],
      };
    }

    // Anomaly placement — avoid corners on the very first warm-up puzzle.
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
    puzzles.push({ gridSize, grid, anomalyIndex, difficulty });
  }

  return puzzles;
}
