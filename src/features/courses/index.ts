// Export components
export { CourseDetailPage } from "./components/CourseDetailPage";

// Export services
export {
  fetchUserCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./services/courseService";

// Export types
export type { Course, CourseWithStats } from "./types";
