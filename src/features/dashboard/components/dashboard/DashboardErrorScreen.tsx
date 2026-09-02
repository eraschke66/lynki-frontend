import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

export function DashboardErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <GhibliBackground />
      <Header />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex items-center justify-center">
        <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="font-sans text-sm text-ghibli-bark">Failed to load dashboard</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-full border-ghibli-moss/40 hover:border-ghibli-forest hover:bg-ghibli-ivory/60"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </ParchmentCard>
      </div>
    </div>
  );
}
