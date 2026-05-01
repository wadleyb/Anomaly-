import { clamp } from "./random";

// Visibility validator: ensure anomaly meets minimum thresholds
export function validateAnomalyVisibility(baseShape, anomalyShape) {
  // For some shapes, rotation is not perceptible or not rendered – don't count it
  const rotationUnsupported = new Set([
    "circle",
    "ring",
    "cross", // rotation not applied in renderer
    "line", // rotation not applied in renderer
    "dash", // rotation not applied in renderer
    "zigzag", // rotation not applied in renderer
    "octagon", // perceptually low-payoff rotation
    "plus", // treat like cross to avoid ambiguous rotations
  ]);

  // Some shapes ignore strokeWidth in renderer
  const strokeUnsupported = new Set(["plus", "cross", "ring"]);

  // Some shapes ignore variant (filled/outline) in renderer
  const variantUnsupported = new Set([
    "plus",
    "cross",
    "ring",
    "line",
    "dash",
    "zigzag",
  ]);

  // Per-shape size thresholds
  const sizeThresholdByType = {
    plus: 0.35, // need bigger size delta for bars
    cross: 0.35,
    octagon: 0.32,
    ring: 0.3,
  };
  const sizeThreshold = sizeThresholdByType[baseShape.type] ?? 0.28;

  // size difference >= threshold
  const sizeDiff =
    Math.abs((anomalyShape.size || 0) - (baseShape.size || 0)) /
    (baseShape.size || 1);
  if (sizeDiff >= sizeThreshold) return true;

  // rotation difference >= 18° (and only for shapes where rotation is clearly visible)
  const rotDiff = Math.abs(
    (anomalyShape.rotation || 0) - (baseShape.rotation || 0),
  );
  if (!rotationUnsupported.has(baseShape.type) && rotDiff >= 18) return true;

  // stroke difference (only where supported)
  if (!strokeUnsupported.has(baseShape.type)) {
    // shape-specific minimums
    const strokeMinByType = { zigzag: 3, line: 2, dash: 2 };
    const strokeMin = strokeMinByType[baseShape.type] ?? 2;
    const strokeDiff = Math.abs(
      (anomalyShape.strokeWidth || 0) - (baseShape.strokeWidth || 0),
    );
    if (strokeDiff >= strokeMin) return true;
  }

  // fill vs outline difference (only where supported)
  if (!variantUnsupported.has(baseShape.type)) {
    if ((anomalyShape.variant || "filled") !== (baseShape.variant || "filled"))
      return true;
  }

  // type difference (shape family)
  if ((anomalyShape.type || "") !== (baseShape.type || "")) return true;

  // position offset visibility >= 10px
  const offX = Math.abs(anomalyShape.offsetX || 0);
  const offY = Math.abs(anomalyShape.offsetY || 0);
  if (offX >= 10 || offY >= 10) return true;

  return false;
}

// Shape generation
export function generateBaseShape(rng, difficulty, score) {
  // tiers based on score for complexity
  const basicShapes = ["square", "circle", "triangle", "diamond", "rectangle"];
  const advShapes = [
    "star",
    "ring",
    "semicircle",
    "horseshoe",
    "octagon",
    "plus",
    "cross",
    "pentagon",
    "hexagon",
    "trapezoid",
  ];
  const complexShapes = [
    "pacman",
    "quartercircle",
    "arc",
    "zigzag",
    "notchedSquare",
    "dash",
    "line",
    "heart",
    "chevron",
    "crescent",
  ];

  let available = [...basicShapes];
  // After score >= 25, allow the full 25-shape library to appear at any time
  if (score >= 25) {
    available.push(...advShapes, ...complexShapes);
  }

  const type = available[Math.floor(rng() * available.length)];

  return {
    type,
    size: 26 + Math.floor(rng() * 14), // 26-40px keeps clarity
    rotation: 0,
    strokeWidth: 2,
    variant: "filled",
    animationType: "none",
  };
}

// Create patterned base grid so the level isn't always uniform, but still has ONE anomaly
export function generatePatternGrid(
  rng,
  gridSize,
  difficulty,
  score,
  baseShapeType,
) {
  const total = gridSize * gridSize;
  const shapes = new Array(total);

  // pattern choice by score
  const patterns = [];
  patterns.push("uniform");
  if (score >= 15) patterns.push("checker", "rowAlt", "colAlt");
  if (score >= 25) patterns.push("diagonal", "border", "quadrants", "xPattern");
  if (score >= 50) patterns.push("spiral", "concentric", "diamonds");
  if (score >= 75)
    patterns.push("mirrorH", "mirrorV", "symmetryBreak", "rotationSymmetry");
  // keep previous advanced distribution too
  if (score >= 50) patterns.push("stripesH", "stripesV");
  if (score >= 75) patterns.push("triad");

  const pattern = patterns[Math.floor(rng() * patterns.length)];

  const pickSecondary = () => {
    // Build pool based on score to include broader shape set after 25
    const basePool = [
      "square",
      "circle",
      "triangle",
      "diamond",
      "rectangle",
      "semicircle",
      "quartercircle",
      "ring",
      "plus",
      "cross",
      "pentagon",
      "hexagon",
      "trapezoid",
    ];
    const extendedPool = [
      "pacman",
      "arc",
      "zigzag",
      "notchedSquare",
      "dash",
      "line",
      "heart",
      "chevron",
      "crescent",
      "octagon",
      "star",
    ];
    const pool = score >= 25 ? [...basePool, ...extendedPool] : basePool;

    // avoid same as base
    let t;
    do {
      t = pool[Math.floor(rng() * pool.length)];
    } while (t === baseShapeType);
    return t;
  };

  const base = {
    type: baseShapeType,
    size: 28,
    rotation: 0,
    strokeWidth: 2,
    variant: "filled",
    animationType: "none",
    patternType: pattern,
  };

  const b = () => ({ ...base });
  const second = { ...b(), type: pickSecondary(), variant: base.variant };
  const third = { ...b(), type: pickSecondary(), variant: base.variant };

  // helpers for some patterns
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    if (pattern === "uniform") {
      shapes[i] = { ...b() };
    } else if (pattern === "checker") {
      shapes[i] = (row + col) % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "rowAlt") {
      shapes[i] = row % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "colAlt") {
      shapes[i] = col % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "stripesH") {
      shapes[i] = { ...b(), variant: "filled" };
      if (row % 2 === 0 && score >= 50) {
        shapes[i].type = "line";
        shapes[i].size = 34;
        shapes[i].strokeWidth = 6;
        shapes[i].variant = "filled";
      }
    } else if (pattern === "stripesV") {
      shapes[i] = { ...b(), variant: "filled" };
      if (col % 2 === 0 && score >= 50) {
        shapes[i].type = "dash"; // a vertical bar
        shapes[i].size = 34;
        shapes[i].strokeWidth = 6;
      }
    } else if (pattern === "triad") {
      const chooser = (row + col) % 3;
      shapes[i] =
        chooser === 0
          ? { ...b() }
          : chooser === 1
            ? { ...second }
            : { ...third };
    } else if (pattern === "diagonal") {
      // Alternates along diagonals (NW to SE)
      shapes[i] = (row - col) % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "border") {
      const isEdge =
        row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1;
      shapes[i] = isEdge ? { ...second } : { ...b() };
    } else if (pattern === "quadrants") {
      const isTop = row < gridSize / 2;
      const isLeft = col < gridSize / 2;
      if (isTop && isLeft) shapes[i] = { ...b() };
      else if (isTop && !isLeft) shapes[i] = { ...second };
      else if (!isTop && isLeft) shapes[i] = { ...third };
      else shapes[i] = { ...b(), type: second.type };
    } else if (pattern === "xPattern") {
      const onX = row === col || row + col === gridSize - 1;
      shapes[i] = onX ? { ...second } : { ...b() };
    } else if (pattern === "concentric") {
      // distance to border defines rings
      const ring = Math.min(row, col, gridSize - 1 - row, gridSize - 1 - col);
      shapes[i] = ring % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "spiral") {
      // simple spiral approximation using ring + diagonal toggle
      const ring = Math.min(row, col, gridSize - 1 - row, gridSize - 1 - col);
      const parity = (ring + (row <= col ? 0 : 1)) % 2;
      shapes[i] = parity === 0 ? { ...b() } : { ...second };
    } else if (pattern === "diamonds") {
      // diamond distance from center
      const d = Math.abs(row - centerRow) + Math.abs(col - centerCol);
      shapes[i] = d % 2 === 0 ? { ...b() } : { ...second };
    } else if (pattern === "mirrorH") {
      // mirror horizontally
      const sourceCol = gridSize - 1 - col;
      const srcIndex = row * gridSize + sourceCol;
      if (col < gridSize / 2) {
        shapes[i] = { ...b() };
      } else {
        shapes[i] = shapes[srcIndex] ? { ...shapes[srcIndex] } : { ...b() };
      }
    } else if (pattern === "mirrorV") {
      // mirror vertically
      const sourceRow = gridSize - 1 - row;
      const srcIndex = sourceRow * gridSize + col;
      if (row < gridSize / 2) {
        shapes[i] = { ...b() };
      } else {
        shapes[i] = shapes[srcIndex] ? { ...shapes[srcIndex] } : { ...b() };
      }
    } else if (pattern === "symmetryBreak") {
      // Build a horizontal mirror, anomaly will break it later
      const sourceCol = gridSize - 1 - col;
      const srcIndex = row * gridSize + sourceCol;
      if (col < gridSize / 2) {
        // left side seeds
        shapes[i] = (row + col) % 2 === 0 ? { ...b() } : { ...second };
      } else {
        shapes[i] = shapes[srcIndex] ? { ...shapes[srcIndex] } : { ...b() };
      }
    } else if (pattern === "rotationSymmetry") {
      // 180-degree rotational symmetry
      const sourceRow = gridSize - 1 - row;
      const sourceCol = gridSize - 1 - col;
      const srcIndex = sourceRow * gridSize + sourceCol;
      if (i <= srcIndex) {
        shapes[i] = (row + col) % 2 === 0 ? { ...b() } : { ...second };
      } else {
        shapes[i] = shapes[srcIndex] ? { ...shapes[srcIndex] } : { ...b() };
      }
    } else {
      // fallback
      shapes[i] = { ...b() };
    }
  }

  return shapes;
}

export function applyAnomaly(rng, baseShape, score) {
  // keep anomalies visible but fair
  let anomalyTypes = [
    "wrongShape",
    "wrongRotation",
    "wrongSize",
    "wrongStrokeWidth",
    "filledVsOutline",
    "offsetPosition",
  ];

  // Capability guards by shape type
  const noRotationTypes = new Set([
    "circle",
    "ring",
    "cross", // rotation property not used in renderer
    "line", // rotation not used
    "dash", // rotation not used
    "zigzag", // rotation not used
    "octagon", // looks very similar when rotated slightly
    "plus", // avoid ambiguous rotations
  ]);
  const noStrokeTypes = new Set(["plus", "cross", "ring"]);
  const noVariantTypes = new Set([
    "plus",
    "cross",
    "ring",
    "line",
    "dash",
    "zigzag",
  ]);

  if (noRotationTypes.has(baseShape.type)) {
    anomalyTypes = anomalyTypes.filter((type) => type !== "wrongRotation");
  }
  if (noStrokeTypes.has(baseShape.type)) {
    anomalyTypes = anomalyTypes.filter((type) => type !== "wrongStrokeWidth");
  }
  if (noVariantTypes.has(baseShape.type)) {
    anomalyTypes = anomalyTypes.filter((type) => type !== "filledVsOutline");
  }

  const anomalyType = anomalyTypes[Math.floor(rng() * anomalyTypes.length)];
  const anomaly = { ...baseShape };

  switch (anomalyType) {
    case "wrongShape": {
      const shapes = [
        "square",
        "circle",
        "triangle",
        "diamond",
        "rectangle",
        "star",
        "ring",
        "semicircle",
        "plus",
        "cross",
        "octagon",
        "pentagon",
        "hexagon",
        "trapezoid",
        "notchedSquare",
        "chevron",
        "crescent",
        "heart",
        "arc",
        "pacman",
      ];
      do {
        anomaly.type = shapes[Math.floor(rng() * shapes.length)];
      } while (anomaly.type === baseShape.type);
      break;
    }
    case "wrongRotation": {
      // Use larger minimum angles; avoid near-symmetry multiples
      const minByType = {
        triangle: 18,
        star: 18,
        pentagon: 18,
        hexagon: 18,
        square: 18,
        diamond: 18,
        rectangle: 18,
        default: 18,
      };
      const min = minByType[baseShape.type] || minByType.default;
      const angle = min + Math.floor(rng() * 18); // 18-35
      anomaly.rotation = angle;
      break;
    }
    case "wrongSize": {
      // ensure at least 28% difference (higher for some shapes)
      const heavySizeTypes = new Set(["plus", "cross"]);
      const bigger = rng() > 0.5;
      const factor = heavySizeTypes.has(baseShape.type)
        ? bigger
          ? 1.4 + rng() * 0.3
          : 0.45 + rng() * 0.15 // 1.4-1.7 or 0.45-0.6
        : bigger
          ? 1.3 + rng() * 0.3
          : 0.5 + rng() * 0.2; // 1.3-1.6 or 0.5-0.7
      anomaly.size = clamp(baseShape.size * factor, 16, 52);
      break;
    }
    case "wrongStrokeWidth": {
      // only set variant=outline where it is supported/visible
      const variantUnsupported = new Set([
        "plus",
        "cross",
        "ring",
        "line",
        "dash",
        "zigzag",
      ]);
      if (!variantUnsupported.has(baseShape.type)) {
        anomaly.variant = "outline"; // makes it obvious on outline-capable shapes
      }
      // at least 2-3px change depending on shape handled in validator; here push it up by +2 or +3
      anomaly.strokeWidth = clamp(
        (baseShape.strokeWidth || 2) + (rng() > 0.5 ? 3 : 2),
        2,
        8,
      );
      break;
    }
    case "filledVsOutline": {
      anomaly.variant = baseShape.variant === "filled" ? "outline" : "filled";
      break;
    }
    case "offsetPosition": {
      // keep offsets noticeable but not off-cell
      const base = score >= 75 ? 14 : 10;
      const delta = base + rng() * 8; // 10-22px or 14-22px
      const signX = rng() > 0.5 ? 1 : -1;
      const signY = rng() > 0.5 ? 1 : -1;
      anomaly.offsetX = Math.round(delta * signX);
      anomaly.offsetY = Math.round(delta * signY);
      break;
    }
  }

  return anomaly;
}
