import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Users, FileText, ClipboardCheck, ArrowLeft } from "lucide-react";

const ADMIN_EMAILS = ["erik@shryn.ai", "erikraschke@gmail.com", "erikraschke@me.com"];

interface UserRow {
  user_id: string;
}

interface StatRow {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? "");

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch distinct user_ids from courses as a proxy for user count
      const { data: userRows } = await supabase
        .from("courses")
        .select("user_id");

      // Fetch total courses
      const { count: courseCount } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true });

      // Fetch total documents
      const { count: docCount } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true });

      // Fetch total quiz sessions
      const { count: quizCount } = await (supabase as any)
        .from("test_sessions")
        .select("id", { count: "exact", head: true });

      // Fetch recent quiz sessions with course info
      const { data: quizzes } = await (supabase as any)
        .from("test_sessions")
        .select("id, user_id, course_id, status, correct_count, total_questions, created_at, courses(title)")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch recent document uploads
      const { data: docs } = await supabase
        .from("documents")
        .select("id, user_id, title, file_type, file_size, status, created_at, courses(title)")
        .order("created_at", { ascending: false })
        .limit(20);

      // Deduplicate user_ids
      const uniqueUserIds = [...new Set((userRows ?? []).map((r: any) => r.user_id))];
      const userList: UserRow[] = uniqueUserIds.map((uid) => ({ user_id: uid }));

      setUsers(userList);
      setRecentQuizzes(quizzes ?? []);
      setRecentDocs(docs ?? []);

      setStats([
        { label: "Total Users", value: userList.length, icon: <Users className="w-5 h-5" /> },
        { label: "Total Courses", value: courseCount ?? 0, icon: <FileText className="w-5 h-5" /> },
        { label: "Total Documents", value: docCount ?? 0, icon: <FileText className="w-5 h-5" /> },
        { label: "Total Quizzes", value: quizCount ?? 0, icon: <ClipboardCheck className="w-5 h-5" /> },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Not authorized.</p>
        </div>
      </>
    );
  }

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      + " " + date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <Header />
      <div className="bg-background pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/home")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold">Admin</h1>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 text-red-700 text-sm">{error}</div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {stats.map((s) => (
              <Card key={s.label} className="rounded-xl">
                <CardContent className="py-5 px-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: "rgba(64,145,108,0.1)" }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Users */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
            <Card className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-medium text-muted-foreground">User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-xs">{u.user_id}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={1} className="py-8 text-center text-muted-foreground">
                        {loading ? "Loading..." : "No users found"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Recent Quizzes */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Recent Quizzes</h2>
            <Card className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-medium text-muted-foreground">Course</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Score</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuizzes.map((q: any) => (
                      <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{q.courses?.title ?? "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            q.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {q.status === "completed"
                            ? `${q.correct_count}/${q.total_questions}`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(q.created_at)}</td>
                      </tr>
                    ))}
                    {recentQuizzes.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">
                        {loading ? "Loading..." : "No quizzes yet"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Recent Documents */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
            <Card className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-medium text-muted-foreground">File</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Course</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Size</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map((d: any) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium maw-w-[200px] truncate" title={d.title}>
                          {d.title}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{d.courses?.title ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatBytes(d.file_size)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            d.status === "processed"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : d.status === "failed"
                              ? "bg-red-500/10 text-red-700"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(d.created_at)}</td>
                      </tr>
                    ))}
                    {recentDocs.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {loading ? "Loading..." : "No uploads yet"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

        </div>
      </div>
    </>
  );
}
