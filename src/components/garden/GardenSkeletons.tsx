import { Skeleton } from "@/components/ui/skeleton";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

/**
 * Shape-matched placeholders for the two screens that carry the most data.
 *
 * These replace full-screen video loaders on the short waits. A skeleton in the
 * real layout costs nothing to paint, keeps the page from feeling frozen, and —
 * because it occupies the same boxes as the real content — the swap doesn't
 * shift anything when the data lands.
 */

function CourseCardSkeleton() {
  return (
    <ParchmentCard hover={false} className="p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-center py-4">
        <Skeleton className="h-28 w-28 rounded-full" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <Skeleton className="h-3 w-40 mx-auto" />
      <Skeleton className="h-10 w-full rounded-full mt-1" />
    </ParchmentCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="relative z-10 max-w-6xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16"
      aria-busy="true"
      aria-label="Loading your garden"
    >
      {/* Hero */}
      <ParchmentCard hover={false} className="p-5 md:p-12 mb-6 md:mb-10">
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-12 w-3/5" />
            <Skeleton className="h-2.5 w-full max-w-[360px] rounded-full" />
            <Skeleton className="h-12 w-52 rounded-full" />
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
      </ParchmentCard>

      <div className="mb-5 px-1 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
      </div>
    </div>
  );
}

function TopicCardSkeleton() {
  return (
    <ParchmentCard hover={false} className="p-5 md:p-6 mb-3 md:mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md shrink-0" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-full rounded-lg" />
        <Skeleton className="h-6 w-5/6 rounded-lg" />
        <Skeleton className="h-6 w-4/6 rounded-lg" />
      </div>
    </ParchmentCard>
  );
}

export function KnowledgeGardenSkeleton() {
  return (
    <div
      className="relative z-10 max-w-5xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16"
      aria-busy="true"
      aria-label="Reading the garden"
    >
      <Skeleton className="h-5 w-32 mb-4 md:mb-6" />

      <ParchmentCard hover={false} className="p-5 md:p-12 mb-6 md:mb-10">
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-11 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
      </ParchmentCard>

      <TopicCardSkeleton />
      <TopicCardSkeleton />
      <TopicCardSkeleton />
    </div>
  );
}
