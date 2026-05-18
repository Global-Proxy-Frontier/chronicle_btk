'use client';

import { geoInterpolate, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';

type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

type FlowItem = {
  customer_id: string;
  customer_name: string;
  risk_tier: RiskTier;
  source_country: string;
  source_city: string;
  source_latitude: number;
  source_longitude: number;
  destination_country: string;
  destination_city: string;
  destination_latitude: number;
  destination_longitude: number;
  ip_address: string;
  amount_try: number;
  is_cross_border: string;
  channel: string;
  category: string;
  transaction_datetime: string;
};

type MapFilters = {
  risk: 'ALL' | RiskTier;
  crossBorderOnly: boolean;
  flowLimit: number;
};

const riskColor: Record<RiskTier, string> = {
  LOW: 'rgba(52, 211, 153, 0.64)',
  MEDIUM: 'rgba(250, 204, 21, 0.68)',
  HIGH: 'rgba(248, 113, 113, 0.78)',
};

const riskWeight: Record<RiskTier, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

type LabelNode = {
  id: string;
  x: number;
  y: number;
  label: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safePathFromPoints(points: Array<[number, number]>, project: (v: [number, number]) => [number, number] | null) {
  let path = '';
  for (let i = 0; i < points.length; i += 1) {
    const p = project(points[i]);
    if (!p) continue;
    path += `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)} `;
  }
  return path.trim();
}

function buildArcPath(
  flow: FlowItem,
  project: (v: [number, number]) => [number, number] | null,
  segmentCount = 32
) {
  const src: [number, number] = [flow.source_longitude, flow.source_latitude];
  const dst: [number, number] = [flow.destination_longitude, flow.destination_latitude];

  const interpolate = geoInterpolate(src, dst);
  const points: Array<[number, number]> = [];

  for (let i = 0; i <= segmentCount; i += 1) {
    points.push(interpolate(i / segmentCount) as [number, number]);
  }

  return safePathFromPoints(points, project);
}

function projectPoint(
  projection: ReturnType<typeof geoNaturalEarth1>,
  value: [number, number]
): [number, number] | null {
  const point = projection(value);
  if (!point) return null;
  return [point[0], point[1]];
}

function shortLabel(value: string, maxLen = 24) {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 3)}...`;
}

function countriesGeo() {
  const data = worldAtlas as unknown as {
    objects: { countries: object };
  };

  const result = feature(data as any, data.objects.countries as any) as FeatureCollection<Geometry, GeoJsonProperties> | Feature<Geometry, GeoJsonProperties>;

  if (result.type === 'FeatureCollection') {
    return result;
  }

  return {
    type: 'FeatureCollection',
    features: [result],
  };
}

export default function WorldFlowMap({ flows }: { flows: FlowItem[] }) {
  const [filters, setFilters] = useState<MapFilters>({
    risk: 'ALL',
    crossBorderOnly: false,
    flowLimit: 180,
  });
  const [hovered, setHovered] = useState<FlowItem | null>(null);
  const [viewport, setViewport] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 1120;
  const height = 540;

  const countries = useMemo(() => countriesGeo(), []);

  const baseProjection = useMemo(() => {
    const proj = geoNaturalEarth1().fitExtent(
      [
        [18, 18],
        [width - 18, height - 18],
      ],
      countries as any
    );

    return {
      scale: proj.scale(),
      translate: proj.translate() as [number, number],
    };
  }, [countries]);

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(baseProjection.scale * viewport.scale)
        .translate([
          baseProjection.translate[0] + viewport.tx,
          baseProjection.translate[1] + viewport.ty,
        ]),
    [baseProjection, viewport.scale, viewport.tx, viewport.ty]
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const countryPaths = useMemo(
    () =>
      countries.features
        .map((country, index) => {
          const d = pathGenerator(country as any);
          if (!d) return null;
          return { id: `country-${index}`, d };
        })
        .filter((item): item is { id: string; d: string } => Boolean(item)),
    [countries, pathGenerator]
  );

  const filtered = useMemo(() => {
    const withCoords = flows.filter(
      (flow) =>
        Number.isFinite(flow.source_latitude) &&
        Number.isFinite(flow.source_longitude) &&
        Number.isFinite(flow.destination_latitude) &&
        Number.isFinite(flow.destination_longitude)
    );

    const byRisk =
      filters.risk === 'ALL'
        ? withCoords
        : withCoords.filter((flow) => flow.risk_tier === filters.risk);

    const byBorder = filters.crossBorderOnly
      ? byRisk.filter((flow) => flow.is_cross_border === '1')
      : byRisk;

    return byBorder
      .sort((a, b) => {
        const byRiskScore = riskWeight[b.risk_tier] - riskWeight[a.risk_tier];
        if (byRiskScore !== 0) return byRiskScore;
        return b.amount_try - a.amount_try;
      })
      .slice(0, filters.flowLimit);
  }, [filters.crossBorderOnly, filters.flowLimit, filters.risk, flows]);

  const renderedFlows = useMemo(() => {
    const segmentCount =
      viewport.scale >= 3.2 ? 52 : viewport.scale >= 2.3 ? 44 : viewport.scale >= 1.7 ? 36 : 30;

    const project = (value: [number, number]) => projectPoint(projection, value);

    return filtered
      .map((flow, index) => {
        const pathD = buildArcPath(flow, project, segmentCount);
        const from = project([flow.source_longitude, flow.source_latitude]);
        const to = project([flow.destination_longitude, flow.destination_latitude]);
        if (!pathD || !from || !to) return null;

        return {
          id: `${flow.customer_id}-${flow.transaction_datetime}-${flow.ip_address}-${index}`,
          flow,
          pathD,
          from,
          to,
        };
      })
      .filter(
        (
          item
        ): item is {
          id: string;
          flow: FlowItem;
          pathD: string;
          from: [number, number];
          to: [number, number];
        } => Boolean(item)
      );
  }, [filtered, projection, viewport.scale]);

  const labelNodes = useMemo(() => {
    if (viewport.scale < 1.25) {
      return [] as LabelNode[];
    }

    const maxLabels = viewport.scale >= 2.8 ? 54 : viewport.scale >= 2 ? 34 : 20;
    const minDistance = viewport.scale >= 2.8 ? 16 : viewport.scale >= 2 ? 22 : 28;

    const candidates: LabelNode[] = [];
    for (const item of renderedFlows) {
      candidates.push({
        id: `src-${item.id}`,
        x: item.from[0],
        y: item.from[1],
        label: shortLabel(`${item.flow.source_city}, ${item.flow.source_country}`),
      });
      candidates.push({
        id: `dst-${item.id}`,
        x: item.to[0],
        y: item.to[1],
        label: shortLabel(`${item.flow.destination_city}, ${item.flow.destination_country}`),
      });
    }

    const selected: LabelNode[] = [];
    const minDistanceSq = minDistance * minDistance;

    for (const candidate of candidates) {
      if (selected.length >= maxLabels) break;
      const crowded = selected.some((current) => {
        const dx = current.x - candidate.x;
        const dy = current.y - candidate.y;
        return dx * dx + dy * dy < minDistanceSq;
      });

      if (crowded) continue;
      selected.push(candidate);
    }

    return selected;
  }, [renderedFlows, viewport.scale]);

  const clampPan = (scale: number, tx: number, ty: number) => {
    const maxX = ((scale - 1) * width) / 2;
    const maxY = ((scale - 1) * height) / 2;

    return {
      tx: clamp(tx, -maxX, maxX),
      ty: clamp(ty, -maxY, maxY),
    };
  };

  const pointerToViewbox = (event: ReactMouseEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * width) / rect.width,
      y: ((event.clientY - rect.top) * height) / rect.height,
    };
  };

  const applyZoom = (zoomFactor: number, anchorX: number, anchorY: number) => {
    setViewport((prev) => {
      const nextScale = clamp(Number((prev.scale * zoomFactor).toFixed(3)), MIN_ZOOM, MAX_ZOOM);
      if (nextScale === prev.scale) return prev;

      const ratio = nextScale / prev.scale;
      const cx = anchorX - width / 2;
      const cy = anchorY - height / 2;

      const nextTxRaw = (1 - ratio) * cx + ratio * prev.tx;
      const nextTyRaw = (1 - ratio) * cy + ratio * prev.ty;
      const nextPan = clampPan(nextScale, nextTxRaw, nextTyRaw);

      return {
        scale: nextScale,
        tx: nextPan.tx,
        ty: nextPan.ty,
      };
    });
  };

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!event.cancelable) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToViewbox(event);
    const zoomFactor = event.deltaY < 0 ? 1.16 : 1 / 1.16;
    applyZoom(zoomFactor, point.x, point.y);
  };

  const handleMouseDown = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const point = pointerToViewbox(event);
    dragRef.current = { x: point.x, y: point.y, tx: viewport.tx, ty: viewport.ty };
    setIsDragging(true);
    setHovered(null);
  };

  const handleMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!isDragging || !drag) return;
    event.preventDefault();
    const point = pointerToViewbox(event);
    const dx = point.x - drag.x;
    const dy = point.y - drag.y;

    setViewport((prev) => {
      const nextPan = clampPan(prev.scale, drag.tx + dx, drag.ty + dy);
      if (nextPan.tx === prev.tx && nextPan.ty === prev.ty) {
        return prev;
      }
      return {
        ...prev,
        tx: nextPan.tx,
        ty: nextPan.ty,
      };
    });
  };

  const stopDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragRef.current = null;
  };

  const resetView = () => {
    setViewport({ scale: 1, tx: 0, ty: 0 });
    setIsDragging(false);
    dragRef.current = null;
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const preventScrollWhileZooming = (event: WheelEvent) => {
      event.preventDefault();
    };

    svg.addEventListener('wheel', preventScrollWhileZooming, { passive: false });
    return () => {
      svg.removeEventListener('wheel', preventScrollWhileZooming);
    };
  }, []);

  const flowStrokeScale = Math.max(0.72, 1 / Math.sqrt(viewport.scale));
  const sourceDotRadius = Math.max(1.2, 2 * flowStrokeScale);
  const targetDotRadius = Math.max(1.3, 2.2 * flowStrokeScale);
  const labelFontSize = viewport.scale >= 2.5 ? 10.5 : viewport.scale >= 1.7 ? 9.5 : 8.6;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="panel-soft flex items-center gap-2 rounded-xl px-2 py-1.5">
          <span className="text-slate-200">Risk:</span>
          {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((risk) => (
            <button
              key={risk}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, risk }))}
              className={
                filters.risk === risk
                  ? 'rounded-lg border border-sky-300/60 bg-sky-500/18 px-2 py-1 text-slate-50'
                  : 'rounded-lg border border-slate-600/70 bg-slate-900/40 px-2 py-1 text-slate-200 hover:border-slate-400/85'
              }
            >
              {risk}
            </button>
          ))}
        </div>

        <label className="panel-soft flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-slate-200">
          <input
            type="checkbox"
            checked={filters.crossBorderOnly}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                crossBorderOnly: event.target.checked,
              }))
            }
          />
          Sadece cross-border
        </label>

        <label className="panel-soft flex items-center gap-2 rounded-xl px-3 py-1.5 text-slate-200">
          Akis limiti
          <input
            type="range"
            min={40}
            max={Math.max(40, Math.min(350, flows.length))}
            step={10}
            value={filters.flowLimit}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                flowLimit: Number(event.target.value),
              }))
            }
            className="accent-sky-400"
          />
          <span className="min-w-9 text-right text-sky-200">{filters.flowLimit}</span>
        </label>
      </div>

      <div className="panel-soft relative overflow-hidden rounded-2xl p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={isDragging ? 'h-[520px] w-full cursor-grabbing select-none' : 'h-[520px] w-full cursor-grab select-none'}
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onDoubleClick={resetView}
          onContextMenu={(event) => event.preventDefault()}
        >
          <rect width={width} height={height} fill="url(#oceanGradient)" />
          <defs>
            <linearGradient id="oceanGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#04142a" />
              <stop offset="52%" stopColor="#061e3f" />
              <stop offset="100%" stopColor="#08224b" />
            </linearGradient>
          </defs>

          <g>
            {countryPaths.map((country) => (
              <path
                key={country.id}
                d={country.d}
                fill="rgba(58, 105, 156, 0.22)"
                stroke="rgba(142, 178, 232, 0.25)"
                strokeWidth={0.7}
              />
            ))}

            {renderedFlows.map((item) => {
              const baseWidth = item.flow.risk_tier === 'HIGH' ? 1.5 : 1.1;
              return (
                <path
                  key={`flow-${item.id}`}
                  d={item.pathD}
                  stroke={riskColor[item.flow.risk_tier]}
                  strokeOpacity={0.7}
                  strokeWidth={Number((baseWidth * flowStrokeScale).toFixed(2))}
                  fill="none"
                  onMouseEnter={() => {
                    if (!isDragging) {
                      setHovered(item.flow);
                    }
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {renderedFlows.map((item) => (
              <g key={`pt-${item.id}`}>
                <circle cx={item.from[0]} cy={item.from[1]} r={sourceDotRadius} fill="rgba(103, 232, 249, 0.95)" />
                <circle cx={item.to[0]} cy={item.to[1]} r={targetDotRadius} fill="rgba(110, 231, 183, 0.95)" />
              </g>
            ))}

            {!isDragging &&
              labelNodes.map((node) => (
                <text
                  key={`label-${node.id}`}
                  x={node.x + 4}
                  y={node.y - 5}
                  fill="rgba(225, 241, 255, 0.95)"
                  fontSize={labelFontSize}
                  fontWeight={500}
                  paintOrder="stroke"
                  stroke="rgba(4, 16, 32, 0.86)"
                  strokeWidth={2.3}
                  pointerEvents="none"
                >
                  {node.label}
                </text>
              ))}
          </g>
        </svg>

        <div className="panel-soft absolute left-3 top-3 flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] text-slate-100">
          <button
            type="button"
            className="rounded-md border border-slate-500/70 px-1.5 py-0.5 hover:border-slate-200/80"
            onClick={() => applyZoom(1 / 1.16, width / 2, height / 2)}
          >
            -
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-500/70 px-1.5 py-0.5 hover:border-slate-200/80"
            onClick={() => applyZoom(1.16, width / 2, height / 2)}
          >
            +
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-500/70 px-2 py-0.5 hover:border-slate-200/80"
            onClick={resetView}
          >
            Reset
          </button>
          <span className="ml-1 text-sky-200">x{viewport.scale.toFixed(2)}</span>
        </div>

        <div className="panel-soft absolute right-3 top-3 rounded-xl px-3 py-2 text-[11px] text-slate-100">
          <p className="mb-1 font-semibold">Gosterilen akis</p>
          <p className="text-sky-200">{renderedFlows.length}</p>
        </div>

        <div className="panel-soft absolute bottom-3 left-3 max-w-[360px] rounded-xl px-3 py-2 text-[11px] text-slate-200">
          {hovered ? (
            <>
              <p className="font-semibold text-slate-50">{hovered.customer_name} ({hovered.customer_id})</p>
              <p className="mt-0.5">{hovered.source_country} -&gt; {hovered.destination_country} | {hovered.channel}/{hovered.category}</p>
              <p className="mt-0.5">{hovered.amount_try.toLocaleString('tr-TR')} TRY | IP {hovered.ip_address}</p>
            </>
          ) : (
            <p>Wheel ile zoom yap, sol tik basili surukleyerek gezin, cift tik ile resetle. Zoom arttikca etiketler netlesir.</p>
          )}
        </div>
      </div>
    </div>
  );
}
