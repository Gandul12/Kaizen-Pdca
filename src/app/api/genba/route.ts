import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logActivity } from "@/lib/activityLogger";
import { buildEmptyItems } from "@/lib/genbaSchedule";
import { verifyGenbaPassword } from "@/lib/genbaAuth";

// GET /api/genba?date=YYYY-MM-DD
// Never 404s — if no row exists for the date yet, returns an in-memory empty
// entry (isNew: true) built from the genba schedule, so the client can render
// the checklist immediately and only persist it on the first POST.
export async function GET(req: NextRequest) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Query param 'date' wajib diisi (format YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.date, date))
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ success: true, data: existing[0] });
    }

    // No row yet for this date — build an empty entry in memory only.
    const emptyEntry = {
      id: "",
      date,
      leaderName: "",
      lineName: "",
      dailyTarget: "",
      items: await buildEmptyItems(),
      linkedProjectId: null,
      createdAt: null,
      updatedAt: null,
    };

    return NextResponse.json({ success: true, data: emptyEntry, isNew: true });
  } catch (error: any) {
    console.error("GET /api/genba error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/genba — upsert by `date` (insert if no row exists for that date,
// otherwise update the existing row). Body: { date, leaderName, lineName, dailyTarget, items }
export async function POST(req: NextRequest) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));

    const date = body.date || "";
    const leaderName = body.leaderName || "";
    const lineName = body.lineName ?? null;
    const dailyTarget = body.dailyTarget ?? null;
    const items = body.items ?? (await buildEmptyItems());

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Field 'date' wajib diisi." },
        { status: 400 }
      );
    }

    if (!leaderName) {
      return NextResponse.json(
        { success: false, error: "Field 'leaderName' wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.date, date))
      .limit(1);

    let savedId: string;

    if (existing.length) {
      // Update the existing row for this date.
      savedId = existing[0].id;
      await db
        .update(genbaEntries)
        .set({
          leaderName,
          lineName,
          dailyTarget,
          items,
          updatedAt: new Date(),
        })
        .where(eq(genbaEntries.id, savedId));
    } else {
      // Insert a new row for this date.
      savedId = "genba-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
      await db.insert(genbaEntries).values({
        id: savedId,
        date,
        leaderName,
        lineName,
        dailyTarget,
        items,
        linkedProjectId: body.linkedProjectId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await logActivity({
      action: "genba_saved",
      detail: `Genba entry for ${date} saved by ${leaderName}`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const saved = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, savedId))
      .limit(1);

    return NextResponse.json({ success: true, data: saved[0] });
  } catch (error: any) {
    console.error("POST /api/genba error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
