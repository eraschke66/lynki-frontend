import { useEffect, useMemo, useState, type RefObject } from "react";
import type { TopicMastery } from "@/features/courses/types";

interface GardenRootsProps {
  /**
   * Ref to the container whose children are the topic cards. Each non-svg
   * child element is treated as one card; centers are computed from
   * getBoundingClientRect and connected with cubic-bezier curves.
   */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * Topic list in the same order as the children of `containerRef.current`.
   * Used to compute concept-overlap edges (Commit 2 — semantic roots).
   * Concept matching is by normalized `concept_name` (trim + lowercase) —
   * id-based linking is the canonicalization backend ticket's job.
   */
  topics: TopicMastery[];
}

/**
 * Decorative tracery behind the topic stack.
 *
 *  Commit 1 — structural vine: every adjacent pair connected.
 *  Commit 2 — semantic edges: non-adjacent topic pairs that share at
 *             least one concept name. Stroke thickness scales with shared
 *             count. Capped at MAX_SEMANTIC_EDGES, sorted by weight desc.
 *  Commit 3 (later) — animation.
 */

const MAX_SEMANTIC_EDGES = 60;

interface SemanticEdgeSpec {
  i: number;
  j: number;
  weight: number;
}

interface RenderedEdge {
  d: string;
  strokeWidth: number;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function strokeForWeight(weight: number): number {
  if (weight >= 3) return 3;
  if (weight === 2) return 2.25;
  return 1.5;
}

function computeSemanticEdges(topics: TopicMastery[]): SemanticEdgeSpec[] {
  const sets = topics.map(
    (t) => new Set(t.concepts.map((c) => normalizeName(c.concept_name))),
  );
  const edges: SemanticEdgeSpec[] = [];
  for (let i = 0; i < topics.length; i++) {
    // j starts at i + 2 — adjacent pairs are already covered by the vine.
    for (let j = i + 2; j < topics.length; j++) {
      let overlap = 0;
      for (const name of sets[i]) {
        if (sets[j].has(name)) overlap++;
      }
      if (overlap >= 1) edges.push({ i, j, weight: overlap });
    }
  }
  edges.sort((a, b) => b.weight - a.weight);
  return edges.slice(0, MAX_SEMANTIC_EDGES);
}

export function GardenRoots({ containerRef, topics }: GardenRootsProps) {
  const [edges, setEdges] = useState<RenderedEdge[]>([]);

  const semanticEdges = useMemo(
    () => computeSemanticEdges(topics),
    [topics],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const containerRect = el.getBoundingClientRect();
      const cards = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() !== "svg",
      ) as HTMLElement[];

      if (cards.length < 2) {
        setEdges([]);
        return;
      }

      const centers = cards.map((card) => {
        const r = card.getBoundingClientRect();
        return {
          cx: r.left - containerRect.left + r.width / 2,
          cy: r.top - containerRect.top + r.height / 2,
        };
      });

      const next: RenderedEdge[] = [];

      // Structural vine — adjacent pairs, S-curve with alternating sway.
      for (let i = 0; i < centers.length - 1; i++) {
        const a = centers[i];
        const b = centers[i + 1];
        const dy = b.cy - a.cy;
        const sway = (i % 2 === 0 ? 1 : -1) * Math.min(60, Math.abs(dy) * 0.25);
        next.push({
          d:
            `M ${a.cx} ${a.cy} ` +
            `C ${a.cx + sway} ${a.cy + dy * 0.4}, ` +
            `${b.cx - sway} ${b.cy - dy * 0.4}, ` +
            `${b.cx} ${b.cy}`,
          strokeWidth: 1.5,
        });
      }

      // Semantic arcs — non-adjacent pairs sharing concepts. Both control
      // points on the same horizontal side so the curve arcs out to the
      // side rather than zig-zagging through intermediate cards. Direction
      // alternates by edge index for visual balance.
      semanticEdges.forEach((edge, idx) => {
        if (edge.i >= centers.length || edge.j >= centers.length) return;
        const a = centers[edge.i];
        const b = centers[edge.j];
        const dy = b.cy - a.cy;
        const span = edge.j - edge.i;
        const sideMag = Math.min(220, span * 35);
        const side = idx % 2 === 0 ? sideMag : -sideMag;
        next.push({
          d:
            `M ${a.cx} ${a.cy} ` +
            `C ${a.cx + side} ${a.cy + dy * 0.25}, ` +
            `${b.cx + side} ${b.cy - dy * 0.25}, ` +
            `${b.cx} ${b.cy}`,
          strokeWidth: strokeForWeight(edge.weight),
        });
      });

      setEdges(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, semanticEdges]);

  if (edges.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      // overflow:visible lets the semantic arcs bulge past the SVG box.
      // No ancestor in the page tree clips horizontally, so the arcs
      // render into the page gutters on wide viewports.
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {edges.map((e, i) => (
        <path
          key={i}
          d={e.d}
          stroke="var(--color-garden-root)"
          strokeWidth={e.strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}
