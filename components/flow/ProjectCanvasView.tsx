"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { ProjectCard, ProjectConnection, ProjectStage } from "@/lib/projects/types";

const STAGE_WIDTH = 280;
const STAGE_GAP = 32;
const CARD_WIDTH = 240;
const CARD_HEIGHT = 92;
const CARD_GAP = 20;
const STAGE_TOP = 64;
const STAGE_BOTTOM = 24;

type StageNodeData = { name: string; count: number };
type ProjectCardNodeData = { card: ProjectCard; onOpen: (card: ProjectCard) => void };

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  return (
    <div className="size-full rounded-[24px] border border-[#2154c2]/20 bg-[#2154c2]/[0.045] p-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#2154c2]/15 bg-card/95 px-3 py-2 shadow-[var(--shadow-soft)]">
        <span className="min-w-0 break-words text-xs font-extrabold tracking-[.1em] text-[#24408f] uppercase">{data.name}</span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">{data.count}</span>
      </div>
      {data.count === 0 && <div className="mt-4 rounded-xl border border-dashed border-[#2154c2]/20 bg-card/45 px-3 py-4 text-center text-xs text-muted-foreground">Nenhum cartão nesta etapa.</div>}
    </div>
  );
}

function ProjectCardNode({ data }: NodeProps<Node<ProjectCardNodeData>>) {
  return (
    <div className="relative size-full">
      <Handle id="target-left" type="target" position={Position.Left} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="target-right" type="target" position={Position.Right} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="target-top" type="target" position={Position.Top} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="target-bottom" type="target" position={Position.Bottom} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <button
        type="button"
        className="flex size-full cursor-pointer flex-col items-start overflow-hidden rounded-2xl border bg-card text-left shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-card)] focus-visible:outline-3 focus-visible:outline-ring"
        onClick={() => data.onOpen(data.card)}
        aria-label={`Editar cartão ${data.card.title}`}
      >
        <span className="line-clamp-2 w-full break-words px-3 pt-3 text-sm leading-snug font-bold">{data.card.title}</span>
        {data.card.notes ? <span className="mt-1 line-clamp-3 w-full whitespace-pre-wrap break-words px-3 pb-3 text-xs leading-snug text-muted-foreground">{data.card.notes}</span> : <span className="mt-1 px-3 pb-3 text-xs text-muted-foreground">Sem notas</span>}
      </button>
      <Handle id="source-left" type="source" position={Position.Left} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="source-right" type="source" position={Position.Right} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="source-top" type="source" position={Position.Top} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
      <Handle id="source-bottom" type="source" position={Position.Bottom} isConnectable={false} className="!size-1 !border-0 !bg-transparent !opacity-0" />
    </div>
  );
}

const nodeTypes = { projectStage: StageNode, projectCard: ProjectCardNode };

interface Props {
  stages: ProjectStage[];
  cards: ProjectCard[];
  connections: ProjectConnection[];
  onOpenCard: (card: ProjectCard) => void;
}

export function ProjectCanvasView({ stages, cards, connections, onOpenCard }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportAppliedRef = useRef(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize((current) => current && Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1 ? current : { width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const nodes = useMemo<Node[]>(() => {
    const stageNodes: Node[] = stages.map((stage, index) => {
      const height = Math.max(210, STAGE_TOP + Math.max(stage.cardIds.length, 1) * (CARD_HEIGHT + CARD_GAP) - CARD_GAP + STAGE_BOTTOM);
      return {
        id: `stage-${stage.id}`,
        type: "projectStage",
        position: { x: 32 + index * (STAGE_WIDTH + STAGE_GAP), y: 32 },
        data: { name: stage.name, count: stage.cardIds.filter((id) => cardsById.has(id)).length },
        width: STAGE_WIDTH,
        height,
        draggable: false,
        selectable: false,
        zIndex: -1,
      };
    });
    const cardNodes: Node[] = stages.flatMap((stage, stageIndex) => stage.cardIds.flatMap((id, cardIndex) => {
      const card = cardsById.get(id);
      if (!card) return [];
      return [{
        id: card.id,
        type: "projectCard",
        position: { x: 32 + stageIndex * (STAGE_WIDTH + STAGE_GAP) + 20, y: 32 + STAGE_TOP + cardIndex * (CARD_HEIGHT + CARD_GAP) },
        data: { card, onOpen: onOpenCard },
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        draggable: false,
        selectable: false,
      }];
    }));
    // Keep orphaned cards visible if imported legacy data has a card missing from every stage.
    const placed = new Set(cardNodes.map((node) => node.id));
    const unplacedNodes: Node[] = cards.filter((card) => !placed.has(card.id)).map((card, index) => ({
      id: card.id,
      type: "projectCard",
      position: { x: 32, y: 32 + STAGE_TOP + index * (CARD_HEIGHT + CARD_GAP) },
      data: { card, onOpen: onOpenCard },
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      draggable: false,
      selectable: false,
    }));
    return [...stageNodes, ...cardNodes, ...unplacedNodes];
  }, [stages, cardsById, onOpenCard, cards]);

  const edges = useMemo<Edge[]>(() => connections.flatMap((connection) => {
    if (!cardsById.has(connection.sourceCardId) || !cardsById.has(connection.targetCardId)) return [];
    const sourceNode = nodes.find((node) => node.id === connection.sourceCardId);
    const targetNode = nodes.find((node) => node.id === connection.targetCardId);
    if (!sourceNode || !targetNode) return [];
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;
    const handles = Math.abs(dx) > Math.abs(dy)
      ? dx > 0 ? { sourceHandle: "source-right", targetHandle: "target-left" } : { sourceHandle: "source-left", targetHandle: "target-right" }
      : dy > 0 ? { sourceHandle: "source-bottom", targetHandle: "target-top" } : { sourceHandle: "source-top", targetHandle: "target-bottom" };
    return [{
      id: connection.id,
      source: connection.sourceCardId,
      target: connection.targetCardId,
      ...handles,
      type: "smoothstep",
      animated: false,
      style: { stroke: "#5669b5", strokeWidth: 1.6 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#5669b5", width: 16, height: 16 },
    }];
  }), [connections, cardsById, nodes]);

  useEffect(() => {
    if (!flow || !size || viewportAppliedRef.current) return;
    const visibleStageCount = Math.max(1, Math.min(stages.length || 1, Math.floor((size.width - 40) / (STAGE_WIDTH + STAGE_GAP))));
    const zoom = Math.max(0.55, Math.min(1, (size.width - 40) / (visibleStageCount * (STAGE_WIDTH + STAGE_GAP))));
    const contentWidth = stages.length ? 32 + (stages.length - 1) * (STAGE_WIDTH + STAGE_GAP) + STAGE_WIDTH : STAGE_WIDTH;
    const x = stages.length <= visibleStageCount ? Math.max(20, (size.width - contentWidth * zoom) / 2 - 32 * zoom) : 20;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void flow.setViewport({ x, y: 20, zoom }, { duration: 0 }).then(() => {
        if (!cancelled) viewportAppliedRef.current = true;
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [flow, size, stages.length]);

  return (
    <div className="overflow-hidden rounded-[24px] border bg-[var(--canvas)] shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-1 border-b bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="text-xs text-muted-foreground">{cards.length === 0 ? "Seu fluxo ainda não tem cartões. Adicione cartões no quadro para preencher as etapas." : "Visualização somente leitura. Clique em um cartão para editá-lo no quadro."}</p>
        {cards.length > 0 && <p className="text-[11px] font-semibold text-muted-foreground"><span className="sm:hidden">Arraste para explorar; use dois dedos para ampliar.</span><span className="hidden sm:inline">Arraste para explorar e use os controles para ampliar.</span></p>}
      </div>
      {connections.length === 0 && <p role="status" className="border-b bg-secondary/50 px-3 py-2 text-xs text-muted-foreground sm:px-4">Sem conexões ainda. Crie relações entre cartões no painel ao lado para exibir setas.</p>}
      <div ref={containerRef} className="relative h-[min(68dvh,760px)] min-h-[360px] w-full touch-none sm:min-h-[440px]">
        {size && <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={setFlow}
          minZoom={0.35}
          maxZoom={1.25}
          panOnDrag
          zoomOnPinch
          zoomOnScroll={false}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          fitView={false}
          proOptions={{ hideAttribution: true }}
          aria-label="Canvas do fluxo personalizado"
        >
          <Background gap={18} color="#d5dbe6" />
          <Controls showInteractive={false} position="bottom-right" className="!hidden sm:!flex" />
        </ReactFlow>}
      </div>
    </div>
  );
}
