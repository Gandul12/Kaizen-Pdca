import { NextRequest, NextResponse } from "next/server";
import { timingSafeCompare } from "@/lib/password";
import { getClientIp, checkRateLimit } from "@/lib/requestHelpers";
import { recordFailure, recordSuccess } from "@/lib/rateLimiter";

const RATE_NS = "genba";

function getGenbaPassword(): string | null {
  return process.env.GENBA_PASSWORD || null;
}

/**
 * Verifikasi header x-genba-password terhadap process.env.GENBA_PASSWORD.
 * Panggil di baris pertama tiap handler /api/genba/*.
 *
 * Return value:
 * - NextResponse (401/429/500) kalau gagal — langsung `return` nilai ini dari handler.
 * - null kalau lolos — lanjutkan eksekusi handler seperti biasa.
 */
export async function requireGenbaAuth(req: NextRequest): Promise<NextResponse | null> {
  // Rate-limit percobaan password gagal, sama seperti /api/admin/*.
  const rateLimited = await checkRateLimit(req, RATE_NS);
  if (rateLimited) return rateLimited;

  const ip = getClientIp(req);
  const genbaPw = getGenbaPassword();

  if (!genbaPw) {
    return NextResponse.json(
      {
        success: false,
        error: "Checklist genba tidak tersedia. GENBA_PASSWORD belum dikonfigurasi di server.",
      },
      { status: 500 }
    );
  }

  const providedPw = req.headers.get("x-genba-password") || "";

  if (!providedPw || !timingSafeCompare(providedPw, genbaPw)) {
    recordFailure(RATE_NS, ip);
    return NextResponse.json(
      { success: false, error: "Password genba salah atau belum diisi." },
      { status: 401 }
    );
  }

  recordSuccess(RATE_NS, ip);
  return null;
}
