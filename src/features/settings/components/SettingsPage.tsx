import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { Neko } from "@/components/garden/Neko";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchProfile, updateProfile } from "../services/profileService";
import { profileQueryKeys } from "@/lib/queryKeys";
import { CURRICULA, getCurriculum } from "@/lib/curricula";

const gardenLevels = [
  { img: "/plant-stage-4.png", label: "Thriving",    range: "85%+",   color: "text-emerald-700" },
  { img: "/plant-stage-3.png", label: "Blooming",    range: "70–84%", color: "text-yellow-600"  },
  { img: "/plant-stage-3.png", label: "Growing",     range: "55–69%", color: "text-green-600"   },
  { img: "/plant-stage-2.png", label: "Sprouting",   range: "40–54%", color: "text-teal-600"    },
  { img: "/plant-stage-1.png", label: "Needs Water", range: "<40%",   color: "text-blue-500"    },
];

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      <div className="relative z-10 min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2D6A4F] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold mb-8">Settings</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground animate-pulse">Tending the garden…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Curriculum card */}
              <Card
                className="rounded-2xl overflow-hidden"
                style={{ borderTop: "3px solid rgba(64,145,108,0.25)" }}
              >
                <CardContent className="pt-8 pb-8 px-8 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="curriculum" className="text-base font-medium">
                      Curriculum
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Choose the grading system used by your school or exam board.
                    </p>
                    <Select value={activeCurriculum} onValueChange={setSelectedCurriculum}>
                      <SelectTrigger
                        id="curriculum"
                        className="w-full max-w-xs border-[rgba(64,145,108,0.2)] focus:border-[#40916C]"
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
                      <p className="text-xs text-muted-foreground">{curriculumInfo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={!hasChanged || mutation.isPending}
                      className="shadow-[0_2px_8px_rgba(13,115,119,0.2)]"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {mutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                    {hasChanged && (
                      <p className="text-xs text-muted-foreground">Unsaved changes</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Garden Growth Guide */}
              <Card
                className="rounded-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(64,145,108,0.05) 0%, rgba(250,243,224,0) 100%)",
                  border: "1px solid rgba(64,145,108,0.12)",
                }}
              >
                <CardContent className="pt-6 pb-6 px-8">
                  <p className="text-sm font-semibold mb-5 text-[#2D6A4F]">Garden Growth Guide</p>
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
                          <p className="text-xs text-muted-foreground">{range} pass probability</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Neko */}
              <div className="flex justify-start mt-4 ml-2 opacity-50 hover:opacity-80 transition-opacity duration-500">
                <Neko />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
