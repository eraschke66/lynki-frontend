import { AddCourseCard } from "@/components/garden/AddCourseCard";
import { HeroSection } from "./HeroSection";
import { CourseCard } from "./CourseCard";
import { EmptyState } from "./EmptyState";
import { ProcessingBanner } from "./ProcessingBanner";
import type { CourseSummary, DashboardData } from "../../types";

interface DashboardContentProps {
  dashboardData: DashboardData;
  curriculum: string;
  onNavigateToCourse: (courseId: string) => void;
  onStartStudying: () => void;
  onUpload: () => void;
  onCreateCourse: () => void;
  onEditCourse: (course: CourseSummary) => void;
  onDeleteCourse: (course: CourseSummary) => void;
}

export function DashboardContent({
  dashboardData,
  curriculum,
  onNavigateToCourse,
  onStartStudying,
  onUpload,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
}: DashboardContentProps) {
  if (dashboardData.courses.length === 0) {
    return <EmptyState onUpload={onUpload} />;
  }

  const processingCourses = dashboardData.courses.filter((c) => c.hasProcessing);
  const nextItem = dashboardData.nextStudyItem;

  return (
    <>
      {processingCourses.length > 0 && <ProcessingBanner processingCourses={processingCourses} />}

      <HeroSection data={dashboardData} curriculum={curriculum} onStartStudying={onStartStudying} onUpload={onUpload} />

      <div className="flex items-end justify-between mb-5 px-1">
        <div>
          <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy">Your Study Garden</h3>
          <p className="font-sans text-sm text-ghibli-bark italic mt-1">
            {dashboardData.courses.length} {dashboardData.courses.length === 1 ? "course" : "courses"} planted • last
            tended today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {dashboardData.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isRecommended={nextItem?.courseId === course.id}
            onClick={() => onNavigateToCourse(course.id)}
            onEdit={() => onEditCourse(course)}
            onDelete={() => onDeleteCourse(course)}
          />
        ))}
        <AddCourseCard onClick={onCreateCourse} />
      </div>

      <p className="text-center text-ghibli-bark text-xs font-sans italic mt-10 md:mt-16 mb-4 tracking-wide">
        🌿 Study gently · grow steadily · breathe deeply 🌿
      </p>
    </>
  );
}
