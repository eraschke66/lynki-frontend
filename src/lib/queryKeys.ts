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
