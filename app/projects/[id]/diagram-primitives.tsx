import type { ReactNode } from "react";

export function DiagramPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust bg-white p-3 shadow-[0_1px_0_rgba(39,33,27,0.04)] print:break-inside-avoid print:shadow-none">
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function DiagramSvg({
  title,
  description,
  children,
  viewBox = "0 0 420 220",
}: {
  title: string;
  description: string;
  children: ReactNode;
  viewBox?: string;
}) {
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;
  const descriptionId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-description`;

  return (
    <svg className="w-full rounded-md border border-sawdust bg-shop" viewBox={viewBox} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>{description}</desc>
      <rect x="10" y="10" width="400" height="200" rx="8" fill="#fffaf0" stroke="#d7c7a1" />
      {children}
    </svg>
  );
}

export function BoardRect({ x, y, width, height, label }: { x: number; y: number; width: number; height: number; label?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="4" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
      {label ? (
        <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}) {
  const horizontal = y1 === y2;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const verticalLabelX = midX - 10;
  const verticalLabelTransform = `rotate(-90 ${verticalLabelX.toString()} ${midY.toString()})`;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#47624a" strokeWidth="2" />
      {horizontal ? (
        <>
          <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} stroke="#47624a" strokeWidth="2" />
          <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} stroke="#47624a" strokeWidth="2" />
          <text x={midX} y={y1 - 8} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x1 - 5} y1={y1} x2={x1 + 5} y2={y1} stroke="#47624a" strokeWidth="2" />
          <line x1={x2 - 5} y1={y2} x2={x2 + 5} y2={y2} stroke="#47624a" strokeWidth="2" />
          <text x={verticalLabelX} y={midY} textAnchor="middle" className="fill-ink text-[11px] font-semibold" transform={verticalLabelTransform}>
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export function Callout({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <text x={x} y={y} className="fill-ink text-[11px] font-semibold">
      {children}
    </text>
  );
}

export function ReviewBadge({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width="132" height="24" rx="5" fill="#fff3c4" stroke="#d7a526" />
      <text x={x + 66} y={y + 16} textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        {label}
      </text>
    </g>
  );
}

export function DiagramNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-5 text-ink/60">{children}</p>;
}
