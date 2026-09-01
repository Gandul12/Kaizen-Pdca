import { NextRequest, NextResponse } from "next/server";
import { timingSafeCompare } from "@/lib/password";

/**
 * Verifikasi password checklist genba, dikirim via header `x-genba-password`.
 * Reuse mekanisme proteksi yang sama dengan /admin (env var + timingSafeCompare
 * dari `@/lib/password`), tapi pakai env var terpisah (`GENBA_PASSWORD`) —
 * bukan `ADMIN_PASSWORD` — supaya akses genba tidak otomatis terbuka oleh
 * siapa pun yang tahu password admin.
 *
 * Return `null` kalau password valid (lanjut ke handler), atau NextResponse
 * error siap-kirim kalau tidak valid — panggil di baris pertama tiap handler:
 *
 *   const authError = verifyGenbaPassword(req);
 *   if (authError) return authError;
 */
export function verifyGenbaPassword(req: NextRequest): NextResponse | null {
  const pw = req.headers.get("x-genba-password") ?? "";
  const envPw = process.env.GENBA_PASSWORD;

  if (!envPw) {
    return NextResponse.json(
      { success: false, error: "GENBA_PASSWORD belum dikonfigurasi di server." },
      { status: 500 }
    );
  }

  if (!timingSafeCompare(pw, envPw)) {
    return NextResponse.json({ success: false, error: "Password salah." }, { status: 401 });
  }

  return null;
}
