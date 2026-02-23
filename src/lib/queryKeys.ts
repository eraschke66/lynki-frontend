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

export const quizQueryKeys = {
  all: ["quizzes"] as const,
  list: (userId: string) => [...quizQueryKeys.all, "list", userId] as const,
  detail: (quizId: string) => [...quizQueryKeys.all, "detail", quizId] as const,
};

export const courseQueryKeys = {
  all: ["courses"] as const,
  list: (userId: string) => [...courseQueryKeys.all, "list", userId] as const,
  detail: (courseId: string) =>
    [...courseQueryKeys.all, "detail", courseId] as const,
};

export const bktQueryKeys = {
  all: ["bkt"] as const,
  progress: (courseId: string, userId: string) =>
    [...bktQueryKeys.all, "progress", courseId, userId] as const,
  session: (courseId: string, userId: string, topicId?: string) =>
    [...bktQueryKeys.all, "session", courseId, userId, topicId] as const,
};
