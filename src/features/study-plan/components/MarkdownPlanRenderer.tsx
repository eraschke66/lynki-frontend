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
      <p className="text-sm text-ghibli-bark leading-relaxed">{children}</p>
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
            <span className="inline-flex items-center gap-1 shrink-0 mt-0.5 text-xs font-semibold bg-ghibli-moss/15 text-ghibli-jungle px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {mins} min
            </span>
            <span className="text-sm text-ghibli-bark leading-relaxed">{action}</span>
          </li>
        );
      }

      if (AFTER_LINE_RE.test(text.trim())) {
        return (
          <li className="flex items-start gap-2 mt-1 border-l-2 border-[hsl(155_43%_48%)] pl-3 py-0.5">
            <span className="text-xs text-ghibli-jungle italic leading-relaxed">{children}</span>
          </li>
        );
      }

      return (
        <li className="flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-[hsl(155_43%_48%)]">🌱</span>
          <span className="text-sm text-ghibli-bark leading-relaxed">{children}</span>
        </li>
      );
    },

    strong: ({ children }) => (
      <strong className="font-semibold text-ghibli-canopy">{children}</strong>
    ),

    em: ({ children }) => (
      <em className="italic text-ghibli-bark">{children}</em>
    ),
  };
}

/**
 * Per-topic body once contained a bullet list of task instructions
 * (e.g. "5 min: Do a recall pass on X"). Those tasks are now owned by the
 * Tending Flow itself. We keep the narrative paragraph and the "After this:
 * this grows from X% to Y%" outcome line, and drop everything in between.
 *
 * Returns the cleaned body markdown plus the After-line text (if any) so
 * the renderer can render it as a styled standalone line outside any list.
 */
function extractAfterAndStripBullets(body: string): {
  afterLine: string | null;
  cleanBody: string;
} {
  let afterLine: string | null = null;
  const cleanLines: string[] = [];
  for (const line of body.split("\n")) {
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    if (!bullet) {
      cleanLines.push(line);
      continue;
    }
    const content = bullet[1].trim();
    if (afterLine === null && AFTER_LINE_RE.test(content)) {
      afterLine = content;
    }
    // Drop the bullet (task or After) from the rendered markdown — After is
    // re-emitted as a standalone styled line below the body.
  }
  return { afterLine, cleanBody: cleanLines.join("\n").trim() };
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
      ? "bg-ghibli-moss"
      : pct >= 50
        ? "bg-[hsl(155_43%_48%)]"
        : pct >= 30
          ? "bg-[hsl(146_42%_62%)]"
          : "bg-[hsl(140_38%_84%)]";

  return (
    <ParchmentCard className="p-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-ghibli-canopy text-base leading-snug">
            {section.topicName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-ghibli-moss/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ghibli-moss shrink-0">{pct}%</span>
          </div>
        </div>
        {topicId && (
          <div className="shrink-0 flex flex-col items-end">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                queryClient.removeQueries({
                  queryKey: testQueryKeys.quiz(courseId, user?.id ?? ""),
                });
                navigate(`/course/${courseId}/tend/${topicId}`);
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Practice
            </Button>
            <p className="mt-1.5 text-[10px] text-ghibli-bark-weak italic leading-tight">
              Weakest concepts first
            </p>
          </div>
        )}
      </div>

      {/* Section body — task bullets stripped; narrative + outcome line only. */}
      {(() => {
        const { afterLine, cleanBody } = extractAfterAndStripBullets(section.body);
        return (
          <>
            {cleanBody && (
              <div className="prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {cleanBody}
                </ReactMarkdown>
              </div>
            )}
            {afterLine && (
              <p className="mt-3 text-xs text-ghibli-jungle italic border-l-2 border-[hsl(155_43%_48%)] pl-3 py-0.5 leading-relaxed">
                {afterLine}
              </p>
            )}
          </>
        );
      })()}
    </ParchmentCard>
  );
}

function RhythmSection({ body }: { body: string }) {
  const components = buildMarkdownComponents();
  return (
    <ParchmentCard className="p-6 bg-ghibli-moss/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌿</span>
        <h3 className="font-serif font-semibold text-ghibli-canopy text-sm uppercase tracking-wide">
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
        <p className="text-sm text-ghibli-bark">
          Something went wrong growing this plan.
        </p>
        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
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
          <Sparkles className="w-4 h-4 text-ghibli-moss shrink-0" />
          <h2 className="font-serif text-lg font-bold text-ghibli-canopy">{planTitle}</h2>
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
