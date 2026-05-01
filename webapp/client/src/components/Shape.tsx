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
    inner = <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fill} rx={4} />;
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
