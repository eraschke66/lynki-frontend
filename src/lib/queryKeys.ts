/**
 * Centralized query keys for React Query.
 * Keeping these in one place makes cache invalidation easier to manage.
 */

export const documentQueryKeys = {
  all: ["documents"] as const,
  list: (userId: string) => [...documentQueryKeys.all, "list", userId] as const,
  stats: (userId: string) =>
    [...documentQueryKeys.all, "stats", userId] as const,
};

export const courseQueryKeys = {
  all: ["courses"] as const,
  list: (userId: string) => [...courseQueryKeys.all, "list", userId] as const,
  detail: (courseId: string) =>
    [...courseQueryKeys.all, "detail", courseId] as const,
};

export const testQueryKeys = {
  all: ["test"] as const,
  quiz: (courseId: string, userId: string) =>
    [...testQueryKeys.all, "quiz", courseId, userId] as const,
  passChance: (courseId: string, userId: string) =>
    [...testQueryKeys.all, "passChance", courseId, userId] as const,
  history: (courseId: string, userId: string) =>
    [...testQueryKeys.all, "history", courseId, userId] as const,
};

export const profileQueryKeys = {
  all: ["profile"] as const,
  detail: (userId: string) =>
    [...profileQueryKeys.all, "detail", userId] as const,
};

export const gardenQueryKeys = {
  all: ["garden"] as const,
  progress: (courseId: string, userId: string) =>
    [...gardenQueryKeys.all, "progress", courseId, userId] as const,
};

export const studyPlanQueryKeys = {
  all: ["studyPlan"] as const,
  detail: (courseId: string, userId: string) =>
    [...studyPlanQueryKeys.all, "detail", courseId, userId] as const,
};

export const topicQuizQueryKeys = {
  all: ["topicQuiz"] as const,
  session: (courseId: string, topicId: string, userId: string) =>
    [...topicQuizQueryKeys.all, "session", courseId, topicId, userId] as const,
};
