/**
 * Client-side visitor ID generator and IP masker for UU PDP compliance.
 */

const VISITOR_KEY = "kaizen_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "usr-anon-server";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      const randHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      id = `usr-${Date.now().toString(36)}-${randHex}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "usr-anon-local";
  }
}

/**
 * Mask raw IP address for UU PDP privacy compliance.
 * e.g. "114.79.123.45" -> "114.79.x.x"
 * e.g. "2001:db8:85a3::8a2e:370:7334" -> "2001:db8:x:x"
 */
export function maskIp(ip?: string | null): string {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
    return "127.0.x.x";
  }

  // IPv4 check
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  // IPv6 check
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:x:x`;
    }
  }

  return "xxx.xxx.x.x";
}

/**
 * Format visitor ID for display (e.g., first 8 chars e.g. "usr-1a2b").
 */
export function formatVisitorId(visitorId?: string | null): string {
  if (!visitorId) return "usr-anon";
  if (visitorId.length <= 10) return visitorId;
  return visitorId.substring(0, 10);
}
