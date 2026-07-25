/**
 * Client-side ownership tracking via localStorage.
 * Stores the list of project IDs this browser has created or joined.
 */

const STORAGE_KEY = "kaizen_my_project_ids";

export function getMyProjectIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function addMyProjectId(id: string): void {
  if (typeof window === "undefined") return;
  const ids = getMyProjectIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function removeMyProjectId(id: string): void {
  if (typeof window === "undefined") return;
  const ids = getMyProjectIds().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function hasMyProjectId(id: string): boolean {
  return getMyProjectIds().includes(id);
}
