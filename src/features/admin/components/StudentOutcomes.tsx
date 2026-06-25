import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ClipboardCheck, Activity, TrendingUp, Minus } from "lucide-react";
import {
  fetchCohort,
  fetchStudentDetail,
  type CohortStudent,
  type StudentDetail,
  type QuizPoint,
} from "../services/studentOutcomesService";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StudentOutcomes() {
  const [cohort, setCohort] = useState<CohortStudent[]>([]);
  const [loadingCohort, setLoadingCohort] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadCohort = useCallback(async () => {
    setLoadingCohort(true);
    setError(null);
    try {
      setCohort(await fetchCohort());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load student outcomes",
      );
    } finally {
      setLoadingCohort(false);
    }
  }, []);

  useEffect(() => {
    loadCohort();
  }, [loadCohort]);

  const openStudent = useCallback(async (s: CohortStudent) => {
    setLoadingDetail(true);
    setDetailError(null);
    setDetail({ ...emptyDetail, user_id: s.user_id, email: s.email });
    try {
      setDetail(await fetchStudentDetail(s.user_id));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Failed to load student");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-4">Student Outcomes</h2>

      {error && (
        <div className="p-4 mb-4 rounded-xl bg-amber-500/10 text-amber-700 text-sm">
          {error}
          <p className="mt-1 text-xs text-amber-600/80">
            This view reads through the admin_student_cohort / admin_student_detail
            RPCs. If they are not deployed yet, apply
            supabase/migrations/admin_student_outcomes_rpcs.sql first.
          </p>
        </div>
      )}

      {detail ? (
        <DetailView
          detail={detail}
          loading={loadingDetail}
          error={detailError}
          onBack={() => {
            setDetail(null);
            setDetailError(null);
          }}
        />
      ) : (
        <Card className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 px-4 font-medium text-ghibli-bark">Student</th>
                  <th className="py-3 px-4 font-medium text-ghibli-bark">Last active</th>
                  <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Quizzes</th>
                  <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Documents</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map((s) => (
                  <tr
                    key={s.user_id}
                    className="border-b last:border-0 hover:bg-ghibli-mist/50 cursor-pointer"
                    onClick={() => openStudent(s)}
                  >
                    <td className="py-3 px-4 font-medium">
                      {s.email ?? <span className="font-mono text-xs">{s.user_id}</span>}
                    </td>
                    <td className="py-3 px-4 text-ghibli-bark">{fmtDate(s.last_active)}</td>
                    <td className="py-3 px-4 text-ghibli-bark text-right">{s.quizzes}</td>
                    <td className="py-3 px-4 text-ghibli-bark text-right">{s.documents}</td>
                  </tr>
                ))}
                {cohort.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ghibli-bark">
                      {loadingCohort ? "Loading..." : "No students found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}

const emptyDetail: StudentDetail = {
  user_id: "",
  email: null,
  lastActive: null,
  documentCount: 0,
  quizCount: 0,
  courses: [],
  quizHistory: [],
  topicMastery: [],
};

function DetailView({
  detail,
  loading,
  error,
  onBack,
}: {
  detail: StudentDetail;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Cohort
        </Button>
        <h3 className="font-semibold break-all">{detail.email ?? detail.user_id}</h3>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 text-amber-700 text-sm">{error}</div>
      )}

      {/* Activity summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile icon={<Activity className="w-4 h-4" />} label="Last active" value={fmtDate(detail.lastActive)} />
        <StatTile icon={<FileText className="w-4 h-4" />} label="Documents" value={String(detail.documentCount)} />
        <StatTile icon={<ClipboardCheck className="w-4 h-4" />} label="Quizzes" value={String(detail.quizCount)} />
      </div>

      {/* Pass probability + mastery per course (current values, no trend) */}
      <div>
        <h4 className="font-medium mb-1">Pass probability and mastery by course</h4>
        <p className="text-xs text-ghibli-bark mb-3">
          Current values, computed the same way as the dashboard. No trend line is drawn —
          there is no history table for these.
        </p>
        <Card className="rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-4 font-medium text-ghibli-bark">Course</th>
                <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Pass probability</th>
                <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Mastery</th>
                <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Docs</th>
              </tr>
            </thead>
            <tbody>
              {detail.courses.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{c.title}</td>
                  <td className="py-3 px-4 text-right">
                    {c.passProbability == null ? "—" : `${c.passProbability}%`}
                  </td>
                  <td className="py-3 px-4 text-right text-ghibli-bark">{c.masteryPercent}%</td>
                  <td className="py-3 px-4 text-right text-ghibli-bark">{c.documentCount}</td>
                </tr>
              ))}
              {detail.courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-ghibli-bark">
                    {loading ? "Loading..." : "No courses"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Quiz scores over time — the only real over-time chart */}
      <div>
        <h4 className="font-medium mb-3">Quiz scores over time</h4>
        {detail.quizHistory.length === 0 ? (
          <p className="text-sm text-ghibli-bark">{loading ? "Loading..." : "No quizzes yet."}</p>
        ) : (
          <>
            <Card className="rounded-xl p-4 mb-3">
              <QuizScoreChart points={detail.quizHistory} />
            </Card>
            <Card className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-medium text-ghibli-bark">Date</th>
                      <th className="py-3 px-4 font-medium text-ghibli-bark">Quiz</th>
                      <th className="py-3 px-4 font-medium text-ghibli-bark">Topic</th>
                      <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...detail.quizHistory].reverse().map((q) => (
                      <tr key={q.id} className="border-b last:border-0">
                        <td className="py-3 px-4 text-ghibli-bark">{fmtDate(q.ts)}</td>
                        <td className="py-3 px-4">{q.label}</td>
                        <td className="py-3 px-4 text-ghibli-bark">{q.topic ?? "—"}</td>
                        <td className="py-3 px-4 text-right font-medium">{q.scorePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Topic mastery (current values from the Knowledge Garden source) */}
      <div>
        <h4 className="font-medium mb-1">Topic mastery</h4>
        <p className="text-xs text-ghibli-bark mb-3">
          Current mastery per concept (the same bkt_mastery source the Knowledge Garden reads).
        </p>
        {detail.topicMastery.length === 0 ? (
          <p className="text-sm text-ghibli-bark">{loading ? "Loading..." : "No mastery data yet."}</p>
        ) : (
          <Card className="rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 font-medium text-ghibli-bark">Topic</th>
                    <th className="py-3 px-4 font-medium text-ghibli-bark">Concept</th>
                    <th className="py-3 px-4 font-medium text-ghibli-bark">Course</th>
                    <th className="py-3 px-4 font-medium text-ghibli-bark text-right">Mastery</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.topicMastery.map((m, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-4">{m.topic ?? "—"}</td>
                      <td className="py-3 px-4 text-ghibli-bark">{m.concept ?? "—"}</td>
                      <td className="py-3 px-4 text-ghibli-bark">{m.course ?? "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <MasteryBadge percent={m.masteryPercent} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border rounded-xl p-3">
      <p className="text-xs text-ghibli-bark flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-base font-semibold mt-1">{value}</p>
    </div>
  );
}

function MasteryBadge({ percent }: { percent: number }) {
  const mastered = percent >= 85;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        mastered ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-600"
      }`}
    >
      {mastered ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <Minus className="w-3 h-3 inline mr-1" />}
      {percent}%
    </span>
  );
}

// Dependency-free SVG line chart of quiz score (%) over time. Points are already
// ascending by timestamp; x is evenly spaced by index, y is the 0-100 score.
function QuizScoreChart({ points }: { points: QuizPoint[] }) {
  const W = 640;
  const H = 200;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const n = points.length;
  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (score: number) => padT + (1 - Math.max(0, Math.min(100, score)) / 100) * innerH;

  const linePts = points.map((p, i) => `${x(i)},${y(p.scorePct)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" role="img" aria-label="Quiz scores over time">
      {/* y gridlines at 0/50/100 */}
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="currentColor" className="text-ghibli-mist" strokeWidth={1} />
          <text x={4} y={y(v) + 4} className="fill-ghibli-bark" fontSize={10}>{v}</text>
        </g>
      ))}
      {/* the score line */}
      <polyline
        points={linePts}
        fill="none"
        stroke="currentColor"
        className="text-ghibli-canopy"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* points + first/last date labels */}
      {points.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.scorePct)} r={3} className="fill-ghibli-canopy" />
      ))}
      {n > 0 && (
        <>
          <text x={x(0)} y={H - 8} className="fill-ghibli-bark" fontSize={10} textAnchor="start">
            {fmtDay(points[0].ts)}
          </text>
          {n > 1 && (
            <text x={x(n - 1)} y={H - 8} className="fill-ghibli-bark" fontSize={10} textAnchor="end">
              {fmtDay(points[n - 1].ts)}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
