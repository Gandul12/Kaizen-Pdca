import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { and, asc, gte, lte } from "drizzle-orm";
import { verifyGenbaPassword } from "@/lib/genbaAuth";

// GET /api/genba/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns entries within the date range, ascending by date.
export async function GET(req: NextRequest) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: "Query param 'start' dan 'end' wajib diisi (format YYYY-MM-DD)." },
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
