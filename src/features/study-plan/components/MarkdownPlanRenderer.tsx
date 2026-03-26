import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Clock, RefreshCw, Sparkles } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { testQueryKeys } from "@/lib/queryKeys";
import type { TopicMastery } from "@/features/courses/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  type: "intro" | "topic" | "rhythm" | "closing";
  heading?: string;         // original h2 text e.g. "Cell Structure — 45%"
  topicName?: string;       // extracted topic name without the "— XX%"
  masteryPct?: number;      // extracted mastery percentage
  body: string;             // markdown body of this section
}

interface MarkdownPlanRendererProps {
  markdown: string;
  courseId: string;
  gardenTopics: TopicMastery[];
  onRegenerate?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOPIC_HEADING_RE = /^(.+?)\s*[—–-]\s*(\d+)%?\s*$/;
const RHYTHM_HEADING_RE = /your\s+rhythm/i;
const TIME_BADGE_RE = /^(\d+)\s*(?:min(?:utes?)?|minutes?)\s*:\s*(.+)/i;
const AFTER_LINE_RE = /^after\b/i;

function splitIntoSections(markdown: string): Section[] {
  // Split on ## or ### headings. Keep delimiter with each section.
  const parts = markdown.split(/(?=^#{2,3}\s)/m);
  const sections: Section[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+?)(?:\n|$)/);
    if (!headingMatch) {
      // No heading — this is intro content (before first ##)
      sections.push({ type: "intro", body: trimmed });
      continue;
    }

    const headingText = headingMatch[2].trim();
    // Strip trailing colon from heading
    const cleanHeading = headingText.replace(/:$/, "").trim();
    // Body is everything after the first line
    const body = trimmed.slice(headingMatch[0].length).trim();

    if (RHYTHM_HEADING_RE.test(cleanHeading)) {
      sections.push({ type: "rhythm", heading: cleanHeading, body });
      continue;
    }

    const topicMatch = TOPIC_HEADING_RE.exec(cleanHeading);
    if (topicMatch) {
      sections.push({
        type: "topic",
        heading: cleanHeading,
        topicName: topicMatch[1].trim(),
        masteryPct: parseInt(topicMatch[2], 10),
        body,
      });
      continue;
    }

    // Heading that doesn't match a topic pattern — treat as closing/rhythm
    sections.push({ type: "closing", heading: cleanHeading, body });
  }

  return sections;
}

// ── Custom markdown components (used inside section bodies) ───────────────────

function buildMarkdownComponents(): Components {
  return {
    // Suppress h1/h2/h3 inside section bodies — we handle headings ourselves
    h1: () => null,
    h2: () => null,
    h3: () => null,

    p: ({ children }) => (
      <p className="text-sm text-[#3d2b1f]/80 leading-relaxed">{children}</p>
    ),

    ul: ({ children }) => (
      <ul className="space-y-2 mt-2">{children}</ul>
    ),

    li: ({ children }) => {
      // Extract the raw text to check for time badges and "After" lines
      const text = extractText(children);

      const timeMatch = TIME_BADGE_RE.exec(text);
      if (timeMatch) {
        const mins = timeMatch[1];
        const action = timeMatch[2];
        return (
          <li className="flex items-start gap-3">
            <span className="inline-flex items-center gap-1 shrink-0 mt-0.5 text-xs font-semibold bg-[rgba(64,145,108,0.12)] text-[#2D6A4F] px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {mins} min
            </span>
            <span className="text-sm text-[#3d2b1f]/80 leading-relaxed">{action}</span>
          </li>
        );
      }

      if (AFTER_LINE_RE.test(text.trim())) {
        return (
          <li className="flex items-start gap-2 mt-1 border-l-2 border-[#52b788] pl-3 py-0.5">
            <span className="text-xs text-[#2D6A4F] italic leading-relaxed">{children}</span>
          </li>
        );
      }

      return (
        <li className="flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-[#52b788]">🌱</span>
          <span className="text-sm text-[#3d2b1f]/80 leading-relaxed">{children}</span>
        </li>
      );
    },

    strong: ({ children }) => (
      <strong className="font-semibold text-[#1B4332]">{children}</strong>
    ),

    em: ({ children }) => (
      <em className="italic text-[#3d2b1f]/70">{children}</em>
    ),
  };
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in (node as object)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(el.props?.children);
  }
  return "";
}

// ── Section renderers ─────────────────────────────────────────────────────────

function IntroSection({ body }: { body: string }) {
  const components = buildMarkdownComponents();
  return (
    <ParchmentCard className="p-6">
      <div className="prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {body}
        </ReactMarkdown>
      </div>
    </ParchmentCard>
  );
}

function TopicSection({
  section,
  topicId,
  courseId,
}: {
  section: Section;
  topicId: string | undefined;
  courseId: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const components = buildMarkdownComponents();

  const pct = section.masteryPct ?? 0;

  // Progress bar colour based on mastery level
  const barColor =
    pct >= 75
      ? "bg-[#40916C]"
      : pct >= 50
        ? "bg-[#52b788]"
        : pct >= 30
          ? "bg-[#74c69d]"
          : "bg-[#b7e4c7]";

  return (
    <ParchmentCard className="p-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-[#1B4332] text-base leading-snug">
            {section.topicName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-[rgba(64,145,108,0.12)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#40916C] shrink-0">{pct}%</span>
          </div>
        </div>
        {topicId && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 text-xs border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
            onClick={() => {
              queryClient.removeQueries({
                queryKey: testQueryKeys.quiz(courseId, user?.id ?? ""),
              });
              navigate(`/test/${courseId}?topicId=${topicId}`);
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Practice
          </Button>
        )}
      </div>

      {/* Section body */}
      <div className="prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {section.body}
        </ReactMarkdown>
      </div>
    </ParchmentCard>
  );
}

function RhythmSection({ body }: { body: string }) {
  const components = buildMarkdownComponents();
  return (
    <ParchmentCard className="p-6 bg-[rgba(64,145,108,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌿</span>
        <h3 className="font-serif font-semibold text-[#1B4332] text-sm uppercase tracking-wide">
          Your rhythm
        </h3>
      </div>
      <div className="prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {body}
        </ReactMarkdown>
      </div>
    </ParchmentCard>
  );
}

function ClosingSection({ body }: { body: string }) {
  const components = buildMarkdownComponents();
  return (
    <ParchmentCard className="p-6 flex gap-3 items-start">
      <span className="text-xl shrink-0">🌸</span>
      <div className="prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {body}
        </ReactMarkdown>
      </div>
    </ParchmentCard>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function MarkdownPlanRenderer({
  markdown,
  courseId,
  gardenTopics,
  onRegenerate,
}: MarkdownPlanRendererProps) {
  // Build a normalized name → topic_id map once
  const topicIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of gardenTopics) {
      map.set(t.topic_name.trim().toLowerCase(), t.topic_id);
    }
    return map;
  }, [gardenTopics]);

  const sections = useMemo(() => splitIntoSections(markdown), [markdown]);

  if (!markdown.trim()) {
    return (
      <ParchmentCard className="p-10 text-center flex flex-col items-center gap-3">
        <span className="text-3xl">🌾</span>
        <p className="text-sm text-muted-foreground">
          Something went wrong growing this plan.
        </p>
        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-[rgba(64,145,108,0.3)]"
            onClick={onRegenerate}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        )}
      </ParchmentCard>
    );
  }

  // Separate the title line (# ...) from the intro body if present
  const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m);
  const planTitle = titleMatch?.[1]?.trim();

  return (
    <div className="space-y-4">
      {/* Plan title card */}
      {planTitle && (
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-[#40916C] shrink-0" />
          <h2 className="font-serif text-lg font-bold text-[#1B4332]">{planTitle}</h2>
        </div>
      )}

      {sections.map((section, i) => {
        switch (section.type) {
          case "intro":
            return <IntroSection key={i} body={section.body} />;

          case "topic": {
            const normalizedName = (section.topicName ?? "").trim().toLowerCase();
            const topicId = topicIdMap.get(normalizedName);
            return (
              <TopicSection
                key={i}
                section={section}
                topicId={topicId}
                courseId={courseId}
              />
            );
          }

          case "rhythm":
            return <RhythmSection key={i} body={section.body} />;

          case "closing":
            return <ClosingSection key={i} body={section.body} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
