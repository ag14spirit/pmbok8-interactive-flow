"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { Expand, Minimize, MonitorUp } from "lucide-react";
import type { DomainId, FlowData } from "@/lib/data/types";
import { requestElementFullscreen } from "@/lib/fullscreen.mjs";

type WebkitFullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function getNativeFullscreenElement() {
  const webkitDocument = document as WebkitFullscreenDocument;
  return document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null;
}

/** Card centers on the A3 poster, measured on the 1698 × 2400 render. */
const CARD_AREAS: Record<string, [number, number, number, number]> = {
  "1.1": [256, 438, 268, 102], "5.1": [256, 590, 268, 102],
  "2.1": [615, 278, 266, 102], "2.2": [615, 408, 266, 102],
  "2.3": [615, 537, 266, 102], "2.4": [615, 668, 266, 102],
  "3.1": [1022, 278, 266, 102], "3.2": [1022, 408, 266, 102],
  "1.2": [1021, 584, 266, 102], "1.3": [1021, 714, 266, 102],
  "4.1": [1434, 278, 266, 102], "4.2": [1434, 408, 266, 102],
  "4.3": [1434, 538, 266, 102],
  "5.2": [962, 874, 266, 102], "5.3": [962, 1004, 266, 102],
  "6.1": [962, 1169, 266, 102], "6.2": [962, 1299, 266, 102],
  "7.1": [1365, 874, 266, 102], "7.2": [1365, 1004, 266, 102],
  "7.3": [1365, 1134, 266, 102], "7.4": [1365, 1264, 266, 102],
  "1.4": [427, 995, 266, 102], "1.5": [280, 1127, 266, 102],
  "1.6": [576, 1127, 266, 102], "7.5": [427, 1294, 266, 102],
  "5.4": [262, 1463, 266, 102], "5.5": [262, 1594, 266, 102],
  "6.3": [590, 1463, 266, 102], "6.4": [590, 1594, 266, 102],
  "2.5": [959, 1505, 266, 102], "2.6": [959, 1635, 266, 102],
  "3.3": [1438, 1505, 266, 102], "4.4": [1438, 1635, 266, 102],
  "1.7": [1197, 1789, 266, 102], "1.8": [1197, 1919, 266, 102],
  "5.6": [958, 2070, 266, 102], "5.7": [958, 2200, 266, 102],
  "6.5": [1438, 2059, 266, 102], "7.6": [1438, 2196, 266, 103],
  "1.9": [426, 1805, 266, 102],
};

/** Legend bands in the A3 footer, at the same scale as the cards. */
const DOMAIN_AREAS: Record<DomainId, [number, number]> = {
  governanca: [90, 295], escopo: [308, 514], cronograma: [526, 732],
  financas: [745, 951], "partes-interessadas": [964, 1169],
  recursos: [1182, 1388], riscos: [1401, 1606],
};

interface Props {
  data: FlowData;
  visibleIds: Set<string>;
  activeDomains: Set<DomainId>;
  onToggleDomain: (id: DomainId) => void;
  onFullscreenTargetChange: (element: HTMLElement | null) => void;
  onOpen: (id: string) => void;
}

export function ValueView({ data, visibleIds, activeDomains, onToggleDomain, onFullscreenTargetChange, onOpen }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const fullscreen = nativeFullscreen || pseudoFullscreen;

  useEffect(() => {
    const update = () => {
      const isNativeFullscreen = getNativeFullscreenElement() === stageRef.current;
      setNativeFullscreen(isNativeFullscreen);
      onFullscreenTargetChange(isNativeFullscreen || pseudoFullscreen ? stageRef.current : null);
    };
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    update();
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
      onFullscreenTargetChange(null);
    };
  }, [onFullscreenTargetChange, pseudoFullscreen]);

  useEffect(() => {
    if (!pseudoFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pseudoFullscreen]);

  const toggleFullscreen = async () => {
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }

    const stage = stageRef.current as WebkitFullscreenElement | null;
    if (!stage) return;

    if (getNativeFullscreenElement() === stage) {
      const webkitDocument = document as WebkitFullscreenDocument;
      const exit = document.exitFullscreen ?? webkitDocument.webkitExitFullscreen;
      if (typeof exit === "function") {
        try {
          await exit.call(document);
        } catch {
          setPseudoFullscreen(true);
        }
      } else {
        setPseudoFullscreen(true);
      }
      return;
    }

    const enteredNativeFullscreen = await requestElementFullscreen(stage);
    setPseudoFullscreen(!enteredNativeFullscreen);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--canvas)]">
      <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border bg-card px-4 py-3 shadow-[var(--shadow-soft)]">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]"><MonitorUp className="size-5" /></span>
            <div>
              <h2 className="text-sm font-bold">Value-driven</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">For the best experience, present on a vertical screen. Click a card to see its details. On a phone, swipe to explore the poster.</p>
            </div>
          </div>
          <button type="button" onClick={toggleFullscreen} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border bg-[var(--surface-subtle)] px-3 text-xs font-bold text-[var(--accent-ink)] hover:bg-[var(--accent)] focus-visible:outline-3 focus-visible:outline-ring">
            <Expand className="size-4" /> Present full screen
          </button>
        </div>
        <div ref={stageRef} data-pseudo-fullscreen={pseudoFullscreen ? "true" : undefined} className="value-stage overflow-x-auto rounded-[20px] border bg-[var(--hero)] shadow-[var(--shadow-card)]">
          {fullscreen && <div className="value-fullscreen-toolbar">
            <button type="button" onClick={toggleFullscreen} className="value-fullscreen-exit inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-[var(--hero)]/90 px-3 text-xs font-bold text-white shadow-lg focus-visible:outline-3 focus-visible:outline-white">
              <Minimize className="size-4" /> Exit full screen
            </button>
          </div>}
          <div className="value-poster relative mx-auto aspect-[841.89/1190.55] w-full min-w-[700px] max-w-[1050px]">
            <Image src={publicAssetPath("/value-oriented.png")} alt="Value-driven process flow, based on Ricardo Vargas's A3 poster" fill sizes="(max-width: 700px) 700px, 100vw" className="object-fill" priority unoptimized />
            {data.processes.map((process) => {
              const area = CARD_AREAS[process.id];
              if (!area) return null;
              const [x, y, w, h] = area;
              return (
                <button
                  key={process.id}
                  type="button"
                  aria-label={`Open ${process.id}: ${process.name}`}
                  title={`${process.id} · ${process.name}`}
                  onClick={() => onOpen(process.id)}
                  className={`absolute z-10 rounded-md border-2 border-transparent transition-colors hover:border-white/90 hover:bg-white/15 focus-visible:border-white focus-visible:bg-white/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8] ${visibleIds.has(process.id) ? "" : "bg-white/75"}`}
                  style={{ left: `${((x - w / 2) / 1698) * 100}%`, top: `${((y - h / 2) / 2400) * 100}%`, width: `${(w / 1698) * 100}%`, height: `${(h / 2400) * 100}%` }}
                />
              );
            })}
            {data.domains.map((domain) => {
              const [left, right] = DOMAIN_AREAS[domain.id];
              const active = activeDomains.has(domain.id);
              return (
                <button
                  key={domain.id}
                  type="button"
                  aria-label={`Filter domain ${domain.number} ${domain.name}`}
                  aria-pressed={active}
                  title={`Filter: ${domain.name}`}
                  onClick={() => onToggleDomain(domain.id)}
                  className={`absolute z-20 rounded-sm transition-colors hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "ring-2 ring-inset ring-white shadow-[0_0_0_2px_#2154c2]" : activeDomains.size > 0 ? "bg-white/45" : ""}`}
                  style={{ left: `${(left / 1698) * 100}%`, top: `${(2301 / 2400) * 100}%`, width: `${((right - left) / 1698) * 100}%`, height: `${(30 / 2400) * 100}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
