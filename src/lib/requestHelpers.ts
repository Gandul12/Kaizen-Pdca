import { NextRequest, NextResponse } from "next/server";
import { isBlocked, recordFailure } from "@/lib/rateLimiter";
import { logActivity } from "@/lib/activityLogger";

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limiter for an endpoint. If blocked, returns a 429 Response
 * (and logs to activity_logs). If not blocked, returns null.
 */
export async function checkRateLimit(
  req: NextRequest,
  namespace: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const rl = isBlocked(namespace, ip, maxAttempts, windowMs);

  if (rl.blocked) {
    await logActivity({
      action: "rate_limit_blocked",
      detail: `Rate-limited [${namespace}] for IP ${ip} (retry after ${rl.retryAfterSeconds}s)`,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json(
      {
        success: false,
        error:
          "Terlalu banyak percobaan password yang gagal. " +
          `Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

  return null;
}
