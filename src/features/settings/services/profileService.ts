/**
 * Profile service — communicates with /api/v1/profile endpoints.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface UserProfile {
  curriculum: string;
}

/**
 * Get user profile (curriculum setting).
 */
export async function fetchProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/profile/${userId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load profile");
  }
  return res.json();
}

/**
 * Update user profile (curriculum setting).
 */
export async function updateProfile(
  userId: string,
  data: { curriculum: string },
): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/profile/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile");
  }
  return res.json();
}
