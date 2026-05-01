import React from "react";
import { Circle, Rect, Path, Group } from "@shopify/react-native-skia";

export function ShapeRenderer({ shape, x, y }) {
  const rotation = (shape.rotation * Math.PI) / 180;

  // Circle
  if (shape.type === "circle") {
    if (shape.variant === "filled") {
      return <Circle cx={x} cy={y} r={shape.size / 2} color="#000" />;
    } else {
      return (
        <Circle
          cx={x}
          cy={y}
          r={shape.size / 2}
          style="stroke"
          strokeWidth={shape.strokeWidth}
          color="#000"
        />
      );
    }
  }

  // Square / Rectangle
  if (shape.type === "square" || shape.type === "rectangle") {
    const width = shape.type === "square" ? shape.size : shape.size * 0.9;
    const height = shape.size;
    const halfW = width / 2;
    const halfH = height / 2;
    if (shape.variant === "filled") {
      return (
        <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
          <Rect
            x={x - halfW}
            y={y - halfH}
            width={width}
            height={height}
            color="#000"
          />
        </Group>
      );
    } else {
      return (
        <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
          <Rect
            x={x - halfW}
            y={y - halfH}
            width={width}
            height={height}
            style="stroke"
            strokeWidth={shape.strokeWidth}
            color="#000"
          />
        </Group>
      );
    }
  }

  // Triangle
  if (shape.type === "triangle") {
    const height = shape.size * 0.866;
    const pathStr = `M ${x} ${y - height / 2} L ${x - shape.size / 2} ${y + height / 2} L ${x + shape.size / 2} ${y + height / 2} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Diamond
  if (shape.type === "diamond") {
    const half = shape.size / 2;
    const pathStr = `M ${x} ${y - half} L ${x + half} ${y} L ${x} ${y + half} L ${x - half} ${y} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Star
  if (shape.type === "star") {
    const outerRadius = shape.size / 2;
    const innerRadius = outerRadius * 0.45;
    let path = "";

    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) path += `M ${px} ${py}`;
      else path += ` L ${px} ${py}`;
    }
    path += " Z";

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={path}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Plus (vertical + horizontal bar)
  if (shape.type === "plus") {
    const s = shape.size;
    const t = Math.max(4, shape.size * 0.25);
    const half = s / 2;
    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Rect x={x - t / 2} y={y - half} width={t} height={s} color="#000" />
        <Rect x={x - half} y={y - t / 2} width={s} height={t} color="#000" />
      </Group>
    );
  }

  // Cross (X)
  if (shape.type === "cross") {
    const s = shape.size;
    const t = Math.max(4, shape.size * 0.22);
    return (
      <Group origin={{ x, y }}>
        <Group transform={[{ rotate: Math.PI / 4 }]} origin={{ x, y }}>
          <Rect x={x - t / 2} y={y - s / 2} width={t} height={s} color="#000" />
        </Group>
        <Group transform={[{ rotate: -Math.PI / 4 }]} origin={{ x, y }}>
          <Rect x={x - t / 2} y={y - s / 2} width={t} height={s} color="#000" />
        </Group>
      </Group>
    );
  }

  // Ring
  if (shape.type === "ring") {
    const outerRadius = shape.size / 2;
    const innerRadius = outerRadius * 0.5;
    return (
      <Group>
        <Circle
          cx={x}
          cy={y}
          r={outerRadius}
          style="stroke"
          strokeWidth={outerRadius - innerRadius}
          color="#000"
        />
      </Group>
    );
  }

  // Semi / Quarter circle / Arc
  if (
    shape.type === "semicircle" ||
    shape.type === "quartercircle" ||
    shape.type === "arc"
  ) {
    const r = shape.size / 2;
    let pathStr = "";
    if (shape.type === "semicircle") {
      pathStr = `M ${x - r} ${y} A ${r} ${r} 0 1 1 ${x + r} ${y} Z`;
    } else if (shape.type === "quartercircle") {
      pathStr = `M ${x} ${y} L ${x} ${y - r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
    } else {
      // open arc stroke
      pathStr = `M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`;
    }

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={
            shape.type === "arc" || shape.variant === "outline"
              ? "stroke"
              : "fill"
          }
          strokeWidth={
            shape.type === "arc"
              ? Math.max(3, shape.strokeWidth + 1)
              : shape.strokeWidth
          }
        />
      </Group>
    );
  }

  // Horseshoe (U)
  if (shape.type === "horseshoe") {
    const radius = shape.size / 2;
    const pathStr = `M ${x - radius} ${y - radius / 2} A ${radius / 2} ${radius / 2} 0 0 1 ${x - radius} ${y + radius / 2} 
                     L ${x - radius / 3} ${y + radius / 2} L ${x - radius / 3} ${y} A ${radius / 3} ${radius / 3} 0 0 0 ${x + radius / 3} ${y}
                     L ${x + radius / 3} ${y + radius / 2} L ${x + radius} ${y + radius / 2} A ${radius / 2} ${radius / 2} 0 0 1 ${x + radius} ${y - radius / 2} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Octagon
  if (shape.type === "octagon") {
    const radius = shape.size / 2;
    let path = "";
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) path += `M ${px} ${py}`;
      else path += ` L ${px} ${py}`;
    }
    path += " Z";

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={path}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Pac-man
  if (shape.type === "pacman") {
    const radius = shape.size / 2;
    const mouthAngle = Math.PI / 6; // 30 degrees
    const startAngle = mouthAngle;
    const endAngle = 2 * Math.PI - mouthAngle;

    const startX = x + radius * Math.cos(startAngle);
    const startY = y + radius * Math.sin(startAngle);
    const endX = x + radius * Math.cos(endAngle);
    const endY = y + radius * Math.sin(endAngle);

    const pathStr = `M ${x} ${y} L ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Notched square
  if (shape.type === "notchedSquare") {
    const s = shape.size;
    const n = Math.max(4, s * 0.2);
    const half = s / 2;
    const pathStr = `M ${x - half} ${y - half + n} L ${x - half} ${y + half} L ${x + half} ${y + half} L ${x + half} ${y - half} L ${x - half + n} ${y - half} Z`;
    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Zigzag
  if (shape.type === "zigzag") {
    const s = shape.size;
    const half = s / 2;
    const step = s / 4;
    let pathStr = `M ${x - half} ${y + half}`;
    for (let i = 1; i <= 4; i++) {
      const px = x - half + i * step;
      const py = i % 2 === 0 ? y + half : y - half;
      pathStr += ` L ${px} ${py}`;
    }
    return (
      <Path
        path={pathStr}
        color="#000"
        style="stroke"
        strokeWidth={Math.max(3, shape.strokeWidth)}
      />
    );
  }

  // Line / Dash (bars)
  if (shape.type === "line" || shape.type === "dash") {
    const isVertical = shape.type === "dash";
    const len = shape.size;
    const thickness = Math.max(4, shape.strokeWidth * 2);
    const w = isVertical ? thickness : len;
    const h = isVertical ? len : thickness;
    return (
      <Rect x={x - w / 2} y={y - h / 2} width={w} height={h} color="#000" />
    );
  }

  // Pentagon (5-sided polygon)
  if (shape.type === "pentagon") {
    const radius = shape.size / 2;
    let path = "";
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) path += `M ${px} ${py}`;
      else path += ` L ${px} ${py}`;
    }
    path += " Z";

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={path}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Hexagon (6-sided polygon)
  if (shape.type === "hexagon") {
    const radius = shape.size / 2;
    let path = "";
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) path += `M ${px} ${py}`;
      else path += ` L ${px} ${py}`;
    }
    path += " Z";

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={path}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Trapezoid
  if (shape.type === "trapezoid") {
    const half = shape.size / 2;
    const topWidth = half * 0.6;
    const pathStr = `M ${x - topWidth} ${y - half} L ${x + topWidth} ${y - half} L ${x + half} ${y + half} L ${x - half} ${y + half} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Heart
  if (shape.type === "heart") {
    const size = shape.size / 2;
    const pathStr = `M ${x} ${y + size * 0.3} 
                     C ${x} ${y - size * 0.2} ${x - size} ${y - size * 0.6} ${x - size * 0.5} ${y - size * 0.9}
                     A ${size * 0.4} ${size * 0.4} 0 0 1 ${x} ${y - size * 0.5}
                     A ${size * 0.4} ${size * 0.4} 0 0 1 ${x + size * 0.5} ${y - size * 0.9}
                     C ${x + size} ${y - size * 0.6} ${x} ${y - size * 0.2} ${x} ${y + size * 0.3} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Chevron (arrow/V shape)
  if (shape.type === "chevron") {
    const half = shape.size / 2;
    const thickness = Math.max(4, shape.size * 0.2);
    const pathStr = `M ${x - half} ${y - half} L ${x} ${y} L ${x - half} ${y + half} L ${x - half + thickness} ${y + half} L ${x} ${y + thickness} L ${x - half + thickness} ${y - half} Z`;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Crescent (moon shape)
  if (shape.type === "crescent") {
    const outerRadius = shape.size / 2;
    const innerRadius = outerRadius * 0.7;
    const offset = outerRadius * 0.3;

    const outerArc = `M ${x - outerRadius} ${y} A ${outerRadius} ${outerRadius} 0 1 1 ${x - outerRadius} ${y + 0.01}`;
    const innerArc = `A ${innerRadius} ${innerRadius} 0 1 0 ${x - outerRadius + offset} ${y} Z`;
    const pathStr = outerArc + innerArc;

    return (
      <Group transform={[{ rotate: rotation }]} origin={{ x, y }}>
        <Path
          path={pathStr}
          color="#000"
          style={shape.variant === "filled" ? "fill" : "stroke"}
          strokeWidth={
            shape.variant === "outline" ? shape.strokeWidth : undefined
          }
        />
      </Group>
    );
  }

  // Default fallback - circle
  return <Circle cx={x} cy={y} r={shape.size / 2} color="#000" />;
}
