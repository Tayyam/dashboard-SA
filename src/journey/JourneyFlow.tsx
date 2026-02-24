import { useEffect, useRef } from 'react';
import { useJourneyData } from '../store/useJourneyData';
import { useJourneyFilters } from '../store/useJourneyFilters';
import type { Pilgrim } from '../core/types';

interface LayerItem {
  label: string;
  value: number;
  isSelected: boolean;
}

function fmtDateDdMm(d: string) {
  const [, month, day] = d.split('-');
  return `${day}/${month}`;
}

type StageField =
  | 'arrival_date'
  | 'arrival_city'
  | 'arrival_hotel'
  | 'arrival_hotel_checkout_date'
  | 'departure_city'
  | 'departure_city_arrival_date'
  | 'departure_hotel'
  | 'departure_hotel_checkout_date'
  | 'departure_date';

type NodeFilterKey =
  | 'node_arrival_date'
  | 'node_arrival_city'
  | 'node_arrival_hotel'
  | 'node_arrival_hotel_checkout_date'
  | 'node_departure_city'
  | 'node_departure_city_arrival_date'
  | 'node_departure_hotel'
  | 'node_departure_hotel_checkout_date'
  | 'node_departure_date';

interface StageDef {
  title: string;
  field: StageField;
  filterKey: NodeFilterKey;
  isDate?: boolean;
  data: LayerItem[];
}

interface TreeNode {
  id: string;
  stageIndex: number;
  field: StageField;
  filterKey: NodeFilterKey;
  label: string;
  value: number;
  isSelected: boolean;
  x: number;
  y: number;
  isDate?: boolean;
}

interface Edge {
  id: string;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  value: number;
  faded: boolean;
  pathD: string;
}

function topNodes(items: LayerItem[], limit = 7): LayerItem[] {
  return [...items].sort((a, b) => b.value - a.value).slice(0, limit);
}

function shortText(text: string, max = 13): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function wrapTextByWords(text: string, maxCharsPerLine = 10, maxLines = 3): string[] {
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  return lines.slice(0, maxLines);
}

function getPairCount(
  data: Pilgrim[],
  fieldA: StageField,
  fieldB: StageField,
  labelsA: Set<string>,
  labelsB: Set<string>
) {
  const map = new Map<string, number>();
  for (const p of data) {
    const a = p[fieldA] as string;
    const b = p[fieldB] as string;
    if (!labelsA.has(a) || !labelsB.has(b)) continue;
    const key = `${a}|||${b}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function JourneyFlow() {
  const {
    filteredData,
    totalPilgrims,
    arrivalDateData,
    arrivalCityData,
    arrivalHotelData,
    arrivalHotelCheckoutDateData,
    departureCityData,
    departureCityArrivalDateData,
    departureHotelData,
    departureHotelCheckoutDateData,
    departureDateData,
  } = useJourneyData();

  const toggleNode = useJourneyFilters((s) => s.toggleNodeFilter);
  const prevNodePosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const prevEdgePathRef = useRef<Map<string, string>>(new Map());

  const stages: StageDef[] = [
    {
      title: 'تاريخ الوصول',
      field: 'arrival_date',
      filterKey: 'node_arrival_date',
      isDate: true,
      data: topNodes(arrivalDateData, 7),
    },
    {
      title: 'مدينة الوصول',
      field: 'arrival_city',
      filterKey: 'node_arrival_city',
      data: topNodes(arrivalCityData, 6),
    },
    {
      title: 'فندق الوصول',
      field: 'arrival_hotel',
      filterKey: 'node_arrival_hotel',
      data: topNodes(arrivalHotelData, 7),
    },
    {
      title: 'مغادرة فندق الوصول',
      field: 'arrival_hotel_checkout_date',
      filterKey: 'node_arrival_hotel_checkout_date',
      isDate: true,
      data: topNodes(arrivalHotelCheckoutDateData, 7),
    },
    {
      title: 'مدينة المغادرة',
      field: 'departure_city',
      filterKey: 'node_departure_city',
      data: topNodes(departureCityData, 6),
    },
    {
      title: 'وصول مدينة المغادرة',
      field: 'departure_city_arrival_date',
      filterKey: 'node_departure_city_arrival_date',
      isDate: true,
      data: topNodes(departureCityArrivalDateData, 7),
    },
    {
      title: 'فندق المغادرة',
      field: 'departure_hotel',
      filterKey: 'node_departure_hotel',
      data: topNodes(departureHotelData, 7),
    },
    {
      title: 'مغادرة الفندق',
      field: 'departure_hotel_checkout_date',
      filterKey: 'node_departure_hotel_checkout_date',
      isDate: true,
      data: topNodes(departureHotelCheckoutDateData, 7),
    },
    {
      title: 'تاريخ المغادرة',
      field: 'departure_date',
      filterKey: 'node_departure_date',
      isDate: true,
      data: topNodes(departureDateData, 7),
    },
  ];

  const colGap = 180;
  const rowGap = 120;
  const firstStageY = 180;
  const headerColWidth = 150;
  const contentPad = 80;
  const stageMaxCount = Math.max(...stages.map((s) => s.data.length), 1);
  const contentWidth = Math.max(920, stageMaxCount * colGap + contentPad * 2);
  const svgWidth = headerColWidth + contentWidth + 40;
  const svgHeight = Math.max(820, firstStageY + stages.length * rowGap + 120);

  const rootX = headerColWidth + contentWidth / 2;
  const rootY = 64;

  const nodes: TreeNode[] = [];
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const y = firstStageY + i * rowGap;
    const span = (stage.data.length - 1) * colGap;
    const stageStartX = headerColWidth + contentWidth / 2 - span / 2;
    for (let j = 0; j < stage.data.length; j++) {
      const item = stage.data[j];
      nodes.push({
        id: `${stage.field}:${item.label}`,
        stageIndex: i,
        field: stage.field,
        filterKey: stage.filterKey,
        label: item.label,
        value: item.value,
        isSelected: item.isSelected,
        x: stageStartX + j * colGap,
        y,
        isDate: stage.isDate,
      });
    }
  }

  const nodesByStage = new Map<number, TreeNode[]>();
  for (const n of nodes) {
    if (!nodesByStage.has(n.stageIndex)) nodesByStage.set(n.stageIndex, []);
    nodesByStage.get(n.stageIndex)!.push(n);
  }

  const edges: Edge[] = [];
  const firstStageNodes = nodesByStage.get(0) ?? [];
  for (const n of firstStageNodes) {
    const c1y = rootY + 34 + (n.y - 32 - (rootY + 34)) * 0.38;
    const c2y = rootY + 34 + (n.y - 32 - (rootY + 34)) * 0.72;
    const pathD = `M ${rootX} ${rootY + 34} C ${rootX} ${c1y}, ${n.x} ${c2y}, ${n.x} ${n.y - 32}`;
    edges.push({
      id: `root->${n.id}`,
      fromId: 'root',
      toId: n.id,
      fromX: rootX,
      fromY: rootY + 34,
      toX: n.x,
      toY: n.y - 32,
      value: n.value,
      faded: !n.isSelected,
      pathD,
    });
  }

  for (let s = 0; s < stages.length - 1; s++) {
    const left = nodesByStage.get(s) ?? [];
    const right = nodesByStage.get(s + 1) ?? [];
    if (!left.length || !right.length) continue;

    const leftLabels = new Set(left.map((n) => n.label));
    const rightLabels = new Set(right.map((n) => n.label));
    const pairMap = getPairCount(
      filteredData,
      stages[s].field,
      stages[s + 1].field,
      leftLabels,
      rightLabels
    );

    const leftMap = new Map(left.map((n) => [n.label, n]));
    const rightMap = new Map(right.map((n) => [n.label, n]));
    const grouped = new Map<string, Array<{ to: string; value: number }>>();

    for (const [key, value] of pairMap.entries()) {
      const [fromLabel, toLabel] = key.split('|||');
      if (!grouped.has(fromLabel)) grouped.set(fromLabel, []);
      grouped.get(fromLabel)!.push({ to: toLabel, value });
    }

    for (const [fromLabel, targets] of grouped.entries()) {
      const fromNode = leftMap.get(fromLabel);
      if (!fromNode) continue;
      targets
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
        .forEach((t) => {
          const toNode = rightMap.get(t.to);
          if (!toNode) return;
          const c1y = fromNode.y + 30 + (toNode.y - 30 - (fromNode.y + 30)) * 0.38;
          const c2y = fromNode.y + 30 + (toNode.y - 30 - (fromNode.y + 30)) * 0.72;
          const pathD = `M ${fromNode.x} ${fromNode.y + 30} C ${fromNode.x} ${c1y}, ${toNode.x} ${c2y}, ${toNode.x} ${toNode.y - 30}`;
          edges.push({
            id: `${fromNode.id}->${toNode.id}`,
            fromId: fromNode.id,
            toId: toNode.id,
            fromX: fromNode.x,
            fromY: fromNode.y + 30,
            toX: toNode.x,
            toY: toNode.y - 30,
            value: t.value,
            faded: !fromNode.isSelected || !toNode.isSelected,
            pathD,
          });
        });
    }
  }

  const maxEdge = Math.max(...edges.map((e) => e.value), 1);
  const MOTION_MS = 1600;

  useEffect(() => {
    const nodeMap = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      nodeMap.set(n.id, { x: n.x, y: n.y });
    }
    prevNodePosRef.current = nodeMap;

    const edgeMap = new Map<string, string>();
    for (const e of edges) {
      edgeMap.set(e.id, e.pathD);
    }
    prevEdgePathRef.current = edgeMap;
  }, [nodes, edges]);

  return (
    <div className="journey-tree-wrap">
      <svg className="journey-tree-svg" width={svgWidth} height={svgHeight}>
        <g transform={`translate(20, ${rootY - 16})`}>
          <rect x="0" y="0" width="126" height="32" rx="9" className="journey-stage-side-pill" />
          <text x="63" y="20" textAnchor="middle" className="journey-stage-side-pill-text">
            بداية الحجاج
          </text>
        </g>

        {stages.map((stage, idx) => (
          <g key={stage.field} transform={`translate(20, ${firstStageY + idx * rowGap - 16})`}>
            <rect x="0" y="0" width="126" height="32" rx="9" className="journey-stage-side-pill" />
            <text x="63" y="20" textAnchor="middle" className="journey-stage-side-pill-text">
              {stage.title}
            </text>
          </g>
        ))}

        <g>
          <circle cx={rootX} cy={rootY} r="34" className="journey-root-circle" />
          <text x={rootX} y={rootY - 4} textAnchor="middle" className="journey-root-count">
            {totalPilgrims}
          </text>
          <text x={rootX} y={rootY + 14} textAnchor="middle" className="journey-root-text">
            الحجاج
          </text>
        </g>

        <g className="journey-edges">
          {edges.map((e) => {
            const strokeW = 0.9 + (e.value / maxEdge) * 3.3;
            const prevPath = prevEdgePathRef.current.get(e.id);
            return (
              <path
                key={e.id}
                d={e.pathD}
                className={e.faded ? 'journey-edge is-faded' : 'journey-edge'}
                style={{ strokeWidth: strokeW }}
              >
                {prevPath && prevPath !== e.pathD && (
                  <animate
                    attributeName="d"
                    from={prevPath}
                    to={e.pathD}
                    dur={`${MOTION_MS}ms`}
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                    keyTimes="0;1"
                  />
                )}
              </path>
            );
          })}
        </g>

        <g className="journey-nodes">
          {nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              className={n.isSelected ? 'journey-node-g' : 'journey-node-g is-faded'}
              onClick={() => toggleNode(n.filterKey, n.label)}
              role="button"
            >
              {(() => {
                const prev = prevNodePosRef.current.get(n.id);
                const from = prev ? `${prev.x} ${prev.y}` : `${n.x} ${rootY + 42}`;
                const to = `${n.x} ${n.y}`;
                if (from === to) return null;
                return (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from={from}
                    to={to}
                    dur={`${MOTION_MS}ms`}
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                    keyTimes="0;1"
                  />
                );
              })()}
              <circle cx="0" cy="0" r="40" className="journey-node-circle" />
              {(() => {
                const isHotelNode = n.field === 'arrival_hotel' || n.field === 'departure_hotel';
                const lines = n.isDate
                  ? [fmtDateDdMm(n.label)]
                  : isHotelNode
                    ? wrapTextByWords(n.label, 10, 2)
                    : [shortText(n.label, 14)];
                const startY = lines.length === 1 ? -8 : -18;
                return (
                  <text
                    x="0"
                    y={startY}
                    textAnchor="middle"
                    className={`journey-node-main-text${isHotelNode ? ' is-wrap' : ''}`}
                  >
                    {lines.map((line, idx) => (
                      <tspan key={`${n.id}-${idx}`} x="0" dy={idx === 0 ? 0 : 10}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                );
              })()}
              <text x="0" y="22" textAnchor="middle" className="journey-node-sub-text">
                {n.value}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
