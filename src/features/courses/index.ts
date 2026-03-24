// Export components
export { CourseDetailPage } from "./components/CourseDetailPage";
export { KnowledgeGardenPage } from "./components/KnowledgeGardenPage";

// Export services
export {
  fetchUserCourses,
  createCourse,
  updateCourse,
  updateCourseTestDate,
  deleteCourse,
  fetchCourseGardenData,
} from "./services/courseService";

// Export types
export type { Course, CourseWithStats, CourseGardenData, TopicMastery, ConceptMastery } from "./types";
