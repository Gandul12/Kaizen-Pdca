import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import crypto from "crypto";
import { verifyGenbaPassword } from "@/lib/genbaAuth";

// GET /api/genba/schedule — daftar semua item checklist AKTIF, terurut
// sectionOrder lalu itemOrder (urutan tampil di halaman /genba).
export async function GET(req: NextRequest) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();

    const items = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.isActive, true))
      .orderBy(asc(genbaScheduleItems.sectionOrder), asc(genbaScheduleItems.itemOrder));

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("GET /api/genba/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/genba/schedule — tambah item checklist baru.
// Body: { sectionId, sectionTitle, point, standard, endMinutes, sectionOrder? }
export async function POST(req: NextRequest) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));

    const sectionId = body.sectionId || "";
    const sectionTitle = body.sectionTitle || "";
    const point = body.point || "";
    const standard = body.standard || "";
    const endMinutes = body.endMinutes;

    if (!sectionId || !sectionTitle) {
      return NextResponse.json(
        { success: false, error: "Field 'sectionId' dan 'sectionTitle' wajib diisi." },
        { status: 400 }
      );
    }
    if (!point || !standard) {
      return NextResponse.json(
        { success: false, error: "Field 'point' dan 'standard' wajib diisi." },
        { status: 400 }
      );
    }
    if (typeof endMinutes !== "number" || Number.isNaN(endMinutes)) {
      return NextResponse.json(
        { success: false, error: "Field 'endMinutes' wajib diisi berupa angka." },
        { status: 400 }
      );
    }

    // Default itemOrder = jumlah item yang sudah ada di section itu (aktif
    // maupun tidak, supaya urutan tidak pernah bertabrakan dengan item yang
    // sudah di-soft-delete tapi masih tersimpan).
    const existingInSection = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.sectionId, sectionId));
    const defaultItemOrder = existingInSection.length;

    // Default sectionOrder: kalau tidak dikirim, ikut sectionOrder yang
    // sudah dipakai section ini (kalau section sudah ada item lain), atau
    // taruh di urutan paling akhir kalau section ini benar-benar baru.
    let sectionOrder = typeof body.sectionOrder === "number" ? body.sectionOrder : undefined;
    if (sectionOrder === undefined) {
      if (existingInSection.length > 0) {
        sectionOrder = existingInSection[0].sectionOrder;
      } else {
        const allItems = await db.select().from(genbaScheduleItems);
        const maxSectionOrder = allItems.reduce((max, it) => Math.max(max, it.sectionOrder), -1);
        sectionOrder = maxSectionOrder + 1;
      }
    }

    const id = "genba-sched-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");

    await db.insert(genbaScheduleItems).values({
      id,
      sectionId,
      sectionTitle,
      sectionOrder,
      itemOrder: defaultItemOrder,
      point,
      standard,
      endMinutes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    return NextResponse.json({ success: true, data: created[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/genba/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
