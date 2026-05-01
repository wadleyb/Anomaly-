import type { Shape as ShapeT } from "@/lib/puzzle";

type Props = {
  shape: ShapeT;
  golden?: boolean;
};

export function Shape({ shape, golden }: Props) {
  const { type, color, rotation, size } = shape;
  const fill = golden ? "#d4a93a" : color;
  const s = 60 * size;
  const cx = 50;
  const cy = 50;

  let inner: JSX.Element | null = null;

  if (type === "circle") {
    inner = <circle cx={cx} cy={cy} r={s / 2} fill={fill} />;
  } else if (type === "square") {
    inner = (
      <rect
        x={cx - s / 2}
        y={cy - s / 2}
        width={s}
        height={s}
        fill={fill}
        rx={4}
      />
    );
  } else if (type === "triangle") {
    const h = s * 0.866;
    inner = (
      <polygon
        points={`${cx},${cy - h / 2} ${cx - s / 2},${cy + h / 2} ${cx + s / 2},${cy + h / 2}`}
        fill={fill}
      />
    );
  } else if (type === "diamond") {
    inner = (
      <polygon
        points={`${cx},${cy - s / 2} ${cx + s / 2},${cy} ${cx},${cy + s / 2} ${cx - s / 2},${cy}`}
        fill={fill}
      />
    );
  } else if (type === "hexagon") {
    const r = s / 2;
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    inner = <polygon points={pts.join(" ")} fill={fill} />;
  } else if (type === "pentagon") {
    const r = s / 2;
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    inner = <polygon points={pts.join(" ")} fill={fill} />;
  } else if (type === "star") {
    const outer = s / 2;
    const inner_r = outer * 0.45;
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner_r;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    inner = <polygon points={pts.join(" ")} fill={fill} />;
  } else if (type === "arrow") {
    // Right-pointing arrow — a chevron. Visibly asymmetric so rotation matters.
    const half = s / 2;
    const w = s * 0.85;
    inner = (
      <polygon
        points={`${cx - w / 2},${cy - half * 0.55} ${cx + w / 2 - half * 0.4},${cy - half * 0.55} ${cx + w / 2},${cy} ${cx + w / 2 - half * 0.4},${cy + half * 0.55} ${cx - w / 2},${cy + half * 0.55} ${cx - w / 2 + half * 0.4},${cy}`}
        fill={fill}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)`, width: "100%", height: "100%" }}
    >
      {inner}
    </svg>
  );
}
