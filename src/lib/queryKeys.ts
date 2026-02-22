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

export const bktQueryKeys = {
  all: ["bkt"] as const,
  progress: (documentId: string, userId: string) =>
    [...bktQueryKeys.all, "progress", documentId, userId] as const,
  session: (documentId: string, userId: string, topicId?: string) =>
    [...bktQueryKeys.all, "session", documentId, userId, topicId] as const,
};
