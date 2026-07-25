import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/db";
import { logActivity } from "@/lib/activityLogger";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "track_visit", 30, 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    await ensureSchema();
    const ip = getClientIp(req);
    await logActivity({
      action: "page_visit",
      detail: "Homepage visit",
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
    });
    return NextResponse.json({ success: true });
  } catch {
    // Jangan pernah gagalkan pengalaman user hanya karena tracking miss
    return NextResponse.json({ success: true });
  }
}
