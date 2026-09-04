import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import crypto from "crypto";
import { requireGenbaAuth } from "@/lib/genbaAuth";

// GET — daftar item AKTIF, urut sectionOrder → itemOrder.
export async function GET(req: NextRequest) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();

    const rows = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.isActive, 1))
      .orderBy(asc(genbaScheduleItems.sectionOrder), asc(genbaScheduleItems.itemOrder));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("GET /api/genba/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — tambah item baru. Kalau sectionId sudah ada di antara item aktif,
// item baru ikut sectionOrder yang sama; kalau belum ada (section baru),
// dapat sectionOrder berikutnya. itemOrder = urutan terakhir + 1 dalam section itu.
export async function POST(req: NextRequest) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const body = await req.json().catch(() => ({}));

    const sectionId = (body.sectionId || "").trim();
    const sectionTitle = (body.sectionTitle || "").trim();
    const point = (body.point || "").trim();
    const standard = (body.standard || "").trim();
    const endMinutes = Number(body.endMinutes);

    if (!sectionId || !sectionTitle || !point || !standard || !Number.isFinite(endMinutes)) {
      return NextResponse.json(
        { success: false, error: "Section, point, standar, dan jam tenggat wajib diisi dengan benar." },
        { status: 400 }
      );
    }

    const activeItems = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.isActive, 1));

    const existingSection = activeItems.find((it) => it.sectionId === sectionId);
    const sectionOrder = existingSection
      ? existingSection.sectionOrder
      : activeItems.reduce((max, it) => Math.max(max, it.sectionOrder), 0) + 1;

    const itemsInSection = activeItems.filter((it) => it.sectionId === sectionId);
    const itemOrder = itemsInSection.reduce((max, it) => Math.max(max, it.itemOrder), 0) + 1;

    const id = "gsi-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    const newItem = {
      id,
      sectionId,
      sectionTitle,
      sectionOrder,
      itemOrder,
      point,
      standard,
      endMinutes: Math.round(endMinutes),
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(genbaScheduleItems).values(newItem);

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    console.error("POST /api/genba/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
