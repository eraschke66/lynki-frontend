import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, Sparkles, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";
import { fetchProfile, updateProfile } from "../services/profileService";
import { profileQueryKeys } from "@/lib/queryKeys";
import { CURRICULA, getCurriculum } from "@/lib/curricula";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useSeedBalance } from "@/features/subscription/hooks/useSeedBalance";
import { createPortalSession } from "@/features/subscription/services/subscriptionService";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Link } from "react-router-dom";

const gardenLevels = [
  { img: "/plant-stage-4.webp", label: "Thriving",    range: "85%+",   color: "text-emerald-700" },
  { img: "/plant-stage-3.webp", label: "Blooming",    range: "70–84%", color: "text-yellow-600"  },
  { img: "/plant-stage-3.webp", label: "Growing",     range: "55–69%", color: "text-green-600"   },
  { img: "/plant-stage-2.webp", label: "Sprouting",   range: "40–54%", color: "text-teal-600"    },
  { img: "/plant-stage-1.webp", label: "Needs Water", range: "<40%",   color: "text-blue-500"    },
];

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isPremium,
    isOnTrial,
    trialEndsAt,
    currentPeriodEnd,
    isLoading: subLoading,
  } = useSubscription();
  const { balance: seedBalance, isLoading: seedLoading } = useSeedBalance();
  const { consent, analyticsEnabled, setAnalytics, clearConsent } =
    useCookieConsent();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    // This used to `return` silently when the context session was missing or
    // its token had expired, which is exactly the reported "button does
    // nothing": no redirect, no spinner, no error. createPortalSession reads
    // the session through supabase.auth.getSession(), which refreshes an
    // expired token on its own, so the check here was both silent and wrong.
    setPortalLoading(true);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/not authenticated/i.test(message)) {
        toast.error("Your session expired", {
          description: "Please log in again to manage your subscription.",
        });
        navigate("/login");
      } else {
        toast.error(message || "Failed to open billing portal");
      }
      setPortalLoading(false);
    }
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const [selectedCurriculum, setSelectedCurriculum] = useState<string | null>(null);
  const activeCurriculum = selectedCurriculum ?? profile?.curriculum ?? "";

  const mutation = useMutation({
    mutationFn: () => updateProfile(user!.id, { curriculum: activeCurriculum }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(user!.id) });
      queryClient.invalidateQueries({ queryKey: ["test"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedCurriculum(null);
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  if (!user) {
    navigate("/home");
    return null;
  }

  const hasChanged = profile && activeCurriculum !== profile.curriculum;
  const curriculumInfo = getCurriculum(activeCurriculum || "percentage");

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-ghibli-forest hover:text-ghibli-jungle transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold text-ghibli-canopy mb-8">Settings</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-ghibli-bark animate-pulse">Tending the garden…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Curriculum card */}
              <Card className="rounded-2xl overflow-hidden border-t-[3px] border-ghibli-moss/40">
                <CardContent className="pt-8 pb-8 px-8 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="curriculum" className="text-base font-medium text-ghibli-canopy">
                      Default curriculum for new courses
                    </Label>
                    <p className="text-sm text-ghibli-bark">
                      The grading system applied to new courses by default. You can
                      override it per course when creating or editing one.
                    </p>
                    <Select value={activeCurriculum} onValueChange={setSelectedCurriculum}>
                      <SelectTrigger
                        id="curriculum"
                        className="w-full max-w-xs"
                      >
                        <SelectValue placeholder="Select curriculum" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRICULA.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeCurriculum && (
                      <p className="text-xs text-ghibli-bark">{curriculumInfo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={!hasChanged || mutation.isPending}
                      className="shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.2)]"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {mutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                    {hasChanged && (
                      <p className="text-xs text-ghibli-bark">Unsaved changes</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Subscription / Billing */}
              {!subLoading && (
                <Card className="rounded-2xl overflow-hidden border-t-[3px] border-ghibli-moss/40">
                  <CardContent className="pt-8 pb-8 px-8 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-ghibli-forest" />
                      <p className="text-base font-medium text-ghibli-canopy">Subscription</p>
                    </div>

                    {isOnTrial ? (
                      // During the trial: state the fact once and stop. No
                      // countdown, no "hurry", no badge that implies a debt —
                      // the garden is an environment, not an urgency system.
                      <>
                        <p className="text-sm text-ghibli-bark">
                          Your garden is open
                          {trialEndsAt
                            ? ` until ${trialEndsAt.toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "long",
                              })}`
                            : ""}
                          . Everything is unlocked, and there is no card on file.
                        </p>
                      </>
                    ) : isPremium ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-moss/12 text-ghibli-jungle">
                            Pass Pro
                          </span>
                          {currentPeriodEnd && (
                            <span className="text-xs text-ghibli-bark">
                              Active until{" "}
                              {currentPeriodEnd.toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {portalLoading ? "Opening…" : "Manage Subscription"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-ghibli-bark">
                          You're on the <strong>Free</strong> plan. Upgrade to unlock the Study Garden and Smart Study Plan.
                        </p>
                        {/* §12 Block F — seed balance display. "Buy more" button
                            ships with Block G (purchase modal); for now this is
                            read-only so users can see what they have. */}
                        {!seedLoading && (
                          <p className="text-sm text-ghibli-bark inline-flex items-center gap-1.5">
                            <span aria-hidden="true">🌱</span>
                            <span className="tabular-nums font-semibold">
                              {seedBalance}
                            </span>
                            <span>
                              {seedBalance === 1 ? "seed" : "seeds"} remaining
                            </span>
                          </p>
                        )}
                        <Button
                          onClick={() => navigate("/pricing")}
                          className="shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.2)] bg-gradient-to-br from-ghibli-moss to-ghibli-canopy text-primary-foreground hover:from-ghibli-jungle hover:to-ghibli-canopy"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade to Pass Pro
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Privacy & Cookies */}
              <Card className="rounded-2xl overflow-hidden border-t-[3px] border-ghibli-moss/40">
                <CardContent className="pt-8 pb-8 px-8 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-ghibli-forest" />
                    <p className="text-base font-medium text-ghibli-canopy">Privacy & Cookies</p>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <Link to="/privacy" className="text-ghibli-jungle hover:underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    <Link to="/terms" className="text-ghibli-jungle hover:underline underline-offset-2">
                      Terms of Service
                    </Link>
                    <Link to="/cookies" className="text-ghibli-jungle hover:underline underline-offset-2">
                      Cookie Policy
                    </Link>
                  </div>
                  <div className="pt-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Label
                          htmlFor="analytics-cookies"
                          className="text-sm font-medium text-ghibli-canopy cursor-pointer"
                        >
                          Analytics cookies
                        </Label>
                        <p className="text-sm text-ghibli-bark mt-0.5">
                          {analyticsEnabled
                            ? "On — anonymous usage data helps us improve PassAI."
                            : "Off — only the essential cookies that keep you logged in."}
                        </p>
                      </div>
                      <Switch
                        id="analytics-cookies"
                        checked={analyticsEnabled}
                        onCheckedChange={setAnalytics}
                        aria-label="Analytics cookies"
                        className="mt-0.5 shrink-0"
                      />
                    </div>
                    {consent !== null && (
                      <button
                        type="button"
                        onClick={clearConsent}
                        className="text-xs text-ghibli-forest hover:text-ghibli-canopy underline underline-offset-2 transition-colors"
                      >
                        Show the cookie banner again
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Garden Growth Guide */}
              <Card className="rounded-2xl overflow-hidden bg-gradient-to-br from-ghibli-moss/8 to-transparent border border-ghibli-moss/20">
                <CardContent className="pt-6 pb-6 px-8">
                  <p className="text-sm font-semibold mb-5 text-ghibli-jungle">Garden Growth Guide</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gardenLevels.map(({ img, label, range, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <img
                          src={img}
                          alt=""
                          className="w-10 h-10 object-contain shrink-0"
                          style={{ mixBlendMode: "darken" }}
                        />
                        <div>
                          <p className={`text-sm font-medium ${color}`}>{label}</p>
                          <p className="text-xs text-ghibli-bark">{range} pass probability</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
