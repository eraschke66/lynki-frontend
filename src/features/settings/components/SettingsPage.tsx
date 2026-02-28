import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
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
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchProfile, updateProfile } from "../services/profileService";
import { profileQueryKeys } from "@/lib/queryKeys";
import { CURRICULA, getCurriculum } from "@/lib/curricula";

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const [selectedCurriculum, setSelectedCurriculum] = useState<string | null>(
    null,
  );

  // Use local override if set, otherwise fall back to profile value
  const activeCurriculum = selectedCurriculum ?? profile?.curriculum ?? "";

  const mutation = useMutation({
    mutationFn: () => updateProfile(user!.id, { curriculum: activeCurriculum }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.detail(user!.id),
      });
      // Invalidate all pass chance queries since the curriculum may affect display
      queryClient.invalidateQueries({ queryKey: ["test"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedCurriculum(null); // Reset override so it tracks server state
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
      <Header />
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Back link */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold mb-8">Settings</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="pt-8 pb-8 px-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="curriculum" className="text-base font-medium">
                    Curriculum
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the grading system used by your school or exam board.
                    This determines the grade scale for your target passing
                    grades.
                  </p>
                  <Select
                    value={activeCurriculum}
                    onValueChange={setSelectedCurriculum}
                  >
                    <SelectTrigger id="curriculum" className="w-full max-w-xs">
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
                    <p className="text-xs text-muted-foreground">
                      {curriculumInfo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={() => mutation.mutate()}
                    disabled={!hasChanged || mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  {hasChanged && (
                    <p className="text-xs text-muted-foreground">
                      Unsaved changes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
