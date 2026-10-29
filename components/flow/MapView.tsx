"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background, Controls, getViewportForBounds, Handle, MarkerType, MiniMap, Position, ReactFlow,
  type Edge, type Node, type NodeProps, type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowData, Process } from "@/lib/data/types";
import { DOMAIN_COLORS } from "@/lib/domain-style";

const SX = 1.22;
const SY = 0.52;
const NODE_W = 200;
const A0_STROKE = "#5669b5";

const HANDLE_SIDES = [
  { id: "left", position: Position.Left },
  { id: "right", position: Position.Right },
  { id: "top", position: Position.Top },
  { id: "bottom", position: Position.Bottom },
] as const;

function connectorHandles(a: Process, b: Process) {
  const dx = (b.position.x - a.position.x) * SX;
  const dy = (b.position.y - a.position.y) * SY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: "source-right", targetHandle: "target-left" }
      : { sourceHandle: "source-left", targetHandle: "target-right" };
  }
  return dy > 0
    ? { sourceHandle: "source-bottom", targetHandle: "target-top" }
    : { sourceHandle: "source-top", targetHandle: "target-bottom" };
}

/** Discrete map regions; the planning clip follows the fold of the A0 composition. */
const PHASE_AREAS = [
  { id: "iniciacao", name: "Initiating", x: 130, y: 180, w: 290, h: 710 },
  { id: "planejamento", name: "Planning", x: 430, y: 180, w: 1850, h: 1390, clip: "polygon(0 0, 100% 0, 100% 100%, 35% 100%, 35% 73.4%, 0 73.4%)" },
  { id: "execucao", name: "Executing", x: 150, y: 1200, w: 910, h: 930 },
  { id: "monitoramento-controle", name: "Monitoring and Controlling", x: 1100, y: 1930, w: 1180, h: 1080 },
  { id: "encerramento", name: "Closing", x: 800, y: 2560, w: 260, h: 330 },
];

type ProcNodeData = { p: Process; dimmed: boolean; selected: boolean };
type PhaseNodeData = { name: string; clip?: string };

function ProcessNode({ data }: NodeProps<Node<ProcNodeData>>) {
  const c = DOMAIN_COLORS[data.p.domain];
  return (
    <div
      className="cursor-pointer overflow-hidden rounded-[14px] border bg-card transition-opacity"
      style={{
        width: NODE_W,
        opacity: data.dimmed ? 0.22 : 1,
        boxShadow: data.selected ? `0 0 0 3px ${c.solid}` : "var(--shadow-soft)",
      }}
    >
      {HANDLE_SIDES.map(({ id, position }) => (
        <Handle key={`target-${id}`} id={`target-${id}`} type="target" position={position} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      ))}
      <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-extrabold tracking-[.12em] text-white uppercase" style={{ background: c.solid }}>
        <span className="font-mono text-[11px] tracking-normal">{data.p.id}</span>
      </div>
      <div className="px-2.5 py-2 text-[13px] leading-snug font-semibold tracking-[-0.01em]">{data.p.name}</div>
      {HANDLE_SIDES.map(({ id, position }) => (
        <Handle key={`source-${id}`} id={`source-${id}`} type="source" position={position} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      ))}
    </div>
  );
}

function PhaseNode({ data }: NodeProps<Node<PhaseNodeData>>) {
  return (
    <div className="pointer-events-none size-full rounded-[28px] border border-[#2154c2]/20 bg-[#2154c2]/[0.045]" style={{ clipPath: data.clip }}>
      <div className="mx-auto mt-2 w-fit max-w-[calc(100%-1rem)] rounded-full border border-[#2154c2]/15 bg-white/90 px-3 py-1 text-center text-[11px] font-extrabold tracking-[.12em] text-[#24408f] uppercase shadow-sm">
        {data.name}
      </div>
    </div>
  );
}

const nodeTypes = { process: ProcessNode, phase: PhaseNode };

function getKnownNodeBounds(nodes: Node[]) {
  const bounds = nodes.map((node) => {
    const { x, y } = node.position;
    const width = node.width ?? NODE_W;
    const height = node.height ?? 62;
    return { x, y, right: x + width, bottom: y + height };
  });
  const x = Math.min(...bounds.map((node) => node.x));
  const y = Math.min(...bounds.map((node) => node.y));
  const right = Math.max(...bounds.map((node) => node.right));
  const bottom = Math.max(...bounds.map((node) => node.bottom));
  return { x, y, width: right - x, height: bottom - y };
}

interface Props {
  data: FlowData;
  visibleIds: Set<string>;
  selectedId: string | null;
  query: string;
  onSelect: (id: string) => void;
}

export function MapView({ data, visibleIds, selectedId, query, onSelect }: Props) {
  const [connectionMode, setConnectionMode] = useState<"a0" | "inferred">("a0");
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [viewportInitialized, setViewportInitialized] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setInitialSize((size) => size && Math.abs(size.width - width) < 1 && Math.abs(size.height - height) < 1
          ? size
          : { width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const nodes = useMemo<Node[]>(() => {
    const phaseNodes: Node[] = PHASE_AREAS.map((area) => ({
      id: `phase-${area.id}`, type: "phase", position: { x: area.x * SX, y: area.y * SY },
      data: { name: area.name, clip: "clip" in area ? area.clip : undefined },
      draggable: false, selectable: false, width: area.w * SX, height: area.h * SY, zIndex: -1,
    }));
    const procNodes: Node[] = data.processes.map((p) => ({
      id: p.id, type: "process",
      position: { x: p.position.x * SX, y: p.position.y * SY },
      data: { p, dimmed: !visibleIds.has(p.id), selected: p.id === selectedId },
      width: NODE_W, height: 62, draggable: false, selectable: false,
    }));
    return [...phaseNodes, ...procNodes];
  }, [data, visibleIds, selectedId]);

  const edges = useMemo<Edge[]>(() => {
    const byId = new Map(data.processes.map((p) => [p.id, p]));
    if (connectionMode === "a0") {
      return data.a0Connectors.map((connector) => {
        const [source, target] = connector.processes;
        const focus = selectedId !== null && (source === selectedId || target === selectedId);
        const visible = visibleIds.has(source) && visibleIds.has(target);
        const marker = { type: MarkerType.ArrowClosed, color: A0_STROKE, width: 13, height: 13 };
        return {
          id: connector.id, source, target, type: "smoothstep",
          ...connectorHandles(byId.get(source)!, byId.get(target)!),
          style: { stroke: A0_STROKE, strokeWidth: focus ? 2.2 : 1.5, opacity: visible ? (selectedId ? (focus ? 0.95 : 0.18) : 0.8) : 0.1 },
          markerStart: marker,
          markerEnd: marker,
        };
      });
    }

    return data.edges.map((edge) => {
      const color = DOMAIN_COLORS[byId.get(edge.source)!.domain].solid;
      const focus = selectedId !== null && (edge.source === selectedId || edge.target === selectedId);
      const visible = visibleIds.has(edge.source) && visibleIds.has(edge.target);
      return {
        id: edge.id, source: edge.source, target: edge.target, type: "smoothstep",
        sourceHandle: "source-right", targetHandle: "target-left",
        style: { stroke: color, strokeWidth: focus ? 1.8 : 1, opacity: visible ? (selectedId ? (focus ? 0.92 : 0.07) : 0.32) : 0.04 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 13, height: 13 },
      };
    });
  }, [data, connectionMode, selectedId, visibleIds]);

  const initialViewport = useMemo(() => initialSize
    ? getViewportForBounds(getKnownNodeBounds(nodes), initialSize.width, initialSize.height, 0.15, 2, 0.1)
    : null, [nodes, initialSize]);
  const searchTargetId = query.trim() && visibleIds.size === 1 ? [...visibleIds][0] : null;

  useEffect(() => {
    if (!flowInstance || !initialViewport || viewportInitialized) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void flowInstance.setViewport(initialViewport, { duration: 0 }).then(() => {
        if (cancelled) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!cancelled) setViewportInitialized(true);
        }));
      }).catch(() => {
        if (!cancelled) requestAnimationFrame(() => setViewportInitialized(true));
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [flowInstance, initialViewport, viewportInitialized]);

  useEffect(() => {
    if (!flowInstance || !viewportInitialized || !searchTargetId) return;
    const frame = requestAnimationFrame(() => {
      const node = flowInstance.getNode(searchTargetId);
      if (!node) return;
      const width = node.measured?.width ?? node.width ?? NODE_W;
      const height = node.measured?.height ?? node.height ?? 62;
      flowInstance.setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 1.1, duration: 350 });
    });
    return () => cancelAnimationFrame(frame);
  }, [flowInstance, searchTargetId, viewportInitialized]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-col gap-1.5 border-b bg-card px-3 py-2 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-muted-foreground uppercase">Connections</span>
          <div role="group" aria-label="Connection type" className="flex min-w-0 flex-1 justify-end gap-1">
            <button type="button" aria-label={`Show explicit A0 arrows, ${data.a0Connectors.length} connections`} aria-pressed={connectionMode === "a0"} onClick={() => setConnectionMode("a0")}
              className={`min-h-9 min-w-0 rounded-lg px-2 text-[11px] font-semibold ${connectionMode === "a0" ? "bg-[var(--brand)] text-white" : "bg-secondary text-muted-foreground"}`}>A0 · {data.a0Connectors.length}</button>
            <button type="button" aria-label={`Show connections inferred from inputs and outputs, ${data.edges.length} connections`} aria-pressed={connectionMode === "inferred"} onClick={() => setConnectionMode("inferred")}
              className={`min-h-9 min-w-0 rounded-lg px-2 text-[11px] font-semibold ${connectionMode === "inferred" ? "bg-[var(--brand)] text-white" : "bg-secondary text-muted-foreground"}`}>Inputs/outputs · {data.edges.length}</button>
          </div>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">On a phone, drag to pan and pinch with two fingers to zoom. On a larger screen, more of the flow is visible.</p>
      </div>
      <div ref={containerRef} className="relative min-h-0 flex-1 w-full bg-[var(--canvas)]">
      {initialSize && initialViewport && <div className="absolute inset-0" style={{ opacity: viewportInitialized ? 1 : 0, visibility: viewportInitialized ? "visible" : "hidden", pointerEvents: viewportInitialized ? "auto" : "none" }} aria-hidden={!viewportInitialized}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => n.type === "process" && onSelect(n.id)}
          defaultViewport={initialViewport}
          minZoom={0.15}
          maxZoom={2}
          panOnDrag
          zoomOnPinch
          nodesConnectable={false}
          attributionPosition="bottom-right"
          onInit={setFlowInstance}
        >
          <Background gap={18} color="#d5dbe6" />
          <Controls showInteractive={false} position="bottom-left" className="!hidden md:!flex" />
          <MiniMap
            pannable zoomable position="top-left" className="!hidden !rounded-xl !border !shadow-[var(--shadow-soft)] md:!block" style={{ width: 220, height: 150 }}
            nodeColor={(n) => (n.type === "process" ? DOMAIN_COLORS[(n.data as ProcNodeData).p.domain].solid : "#111d39")}
            maskColor="rgb(243 245 249 / 70%)"
          />
        </ReactFlow>
      </div>}
      <div className="absolute top-3 right-3 z-10 hidden max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-xl border bg-card p-1.5 text-xs shadow-[var(--shadow-soft)] md:flex">
        <span className="px-1.5 text-[10px] font-extrabold tracking-[.12em] text-muted-foreground uppercase">Connections</span>
        <div role="group" aria-label="Connection type" className="flex flex-wrap gap-1">
          <button type="button" aria-pressed={connectionMode === "a0"} onClick={() => setConnectionMode("a0")}
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${connectionMode === "a0" ? "bg-[var(--brand)] text-white" : "text-muted-foreground hover:bg-secondary"}`}>
            A0 arrows ({data.a0Connectors.length})
          </button>
          <button type="button" aria-pressed={connectionMode === "inferred"} onClick={() => setConnectionMode("inferred")}
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${connectionMode === "inferred" ? "bg-[var(--brand)] text-white" : "text-muted-foreground hover:bg-secondary"}`}>
            Inputs and outputs ({data.edges.length})
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
