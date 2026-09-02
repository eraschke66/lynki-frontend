import { Header } from "@/components/layout/Header";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { DashboardSkeleton } from "@/components/garden/GardenSkeletons";

// A 4.3 MB video used to cover this wait, which usually lasts a few hundred
// milliseconds. The skeleton paints instantly in the real layout instead.
export function DashboardLoadingScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <GhibliBackground />
      <Header />
      <DashboardSkeleton />
    </div>
  );
}
