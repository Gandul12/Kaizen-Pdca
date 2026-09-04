import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { buildEmptyItems } from "@/lib/genbaSchedule";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logActivity } from "@/lib/activityLogger";
import { requireGenbaAuth } from "@/lib/genbaAuth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET ?date=YYYY-MM-DD — cari entry existing, atau bangun entry kosong
// (belum disimpan ke DB) dari buildEmptyItems() kalau belum ada.
export async function GET(req: NextRequest) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";

    if (!DATE_RE.test(date)) {
      return NextResponse.json(
        { success: false, error: "Parameter 'date' wajib diisi dengan format YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.date, date))
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ success: true, data: existing[0], isNew: false });
    }

    // Belum ada entry untuk tanggal ini — tidak pernah 404, kembalikan entry
    // kosong yang belum disimpan ke DB.
    const emptyEntry = {
      date,
      leaderName: "",
      lineName: "",
      dailyTarget: "",
      items: await buildEmptyItems(),
      linkedProjectId: null,
    };

    return NextResponse.json({ success: true, data: emptyEntry, isNew: true });
  } catch (error: any) {
    console.error("GET /api/genba error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — upsert by date (bukan multi-row per tanggal sama).
export async function POST(req: NextRequest) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const date = body.date || "";

    if (!DATE_RE.test(date)) {
      return NextResponse.json(
        { success: false, error: "Field 'date' wajib diisi dengan format YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const leaderName = (body.leaderName || "").trim();
    if (!leaderName) {
      return NextResponse.json(
        { success: false, error: "Nama leader wajib diisi." },
        { status: 400 }
      );
    }

    const lineName = body.lineName ?? null;
    const dailyTarget = body.dailyTarget ?? null;
    const items = Array.isArray(body.items) ? body.items : await buildEmptyItems();

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.date, date))
      .limit(1);

    let saved;
    if (existing.length) {
      const id = existing[0].id;
      const updateData: any = {
        leaderName,
        lineName,
        dailyTarget,
        items,
        updatedAt: new Date(),
      };
      if (body.linkedProjectId !== undefined) {
        updateData.linkedProjectId = body.linkedProjectId;
      }
      if (body.linkedProjectShareToken !== undefined) {
        updateData.linkedProjectShareToken = body.linkedProjectShareToken;
      }

      await db.update(genbaEntries).set(updateData).where(eq(genbaEntries.id, id));
      const updated = await db.select().from(genbaEntries).where(eq(genbaEntries.id, id)).limit(1);
      saved = updated[0];
    } else {
      const id = "genba-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
      const newEntry = {
        id,
        date,
        leaderName,
        lineName,
        dailyTarget,
        items,
        linkedProjectId: body.linkedProjectId ?? null,
        linkedProjectShareToken: body.linkedProjectShareToken ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(genbaEntries).values(newEntry);
      saved = newEntry;
    }

    await logActivity({
      action: "genba_saved",
      projectId: saved.linkedProjectId || null,
      detail: `Genba entry ${date} disimpan oleh ${leaderName}`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/genba error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
