import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { and, asc, gte, lte } from "drizzle-orm";
import { requireGenbaAuth } from "@/lib/genbaAuth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET ?start=YYYY-MM-DD&end=YYYY-MM-DD → GenbaEntry[] terurut ascending by date.
// Dipakai untuk export mingguan (FR-7).
export async function GET(req: NextRequest) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";

    if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
      return NextResponse.json(
        { success: false, error: "Parameter 'start' dan 'end' wajib diisi dengan format YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { success: false, error: "'start' harus sebelum atau sama dengan 'end'." },
        { status: 400 }
      );
    }

    const entries = await db
      .select()
      .from(genbaEntries)
      .where(and(gte(genbaEntries.date, start), lte(genbaEntries.date, end)))
      .orderBy(asc(genbaEntries.date));

    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    console.error("GET /api/genba/range error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
