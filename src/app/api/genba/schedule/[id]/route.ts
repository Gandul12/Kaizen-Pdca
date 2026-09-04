import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireGenbaAuth } from "@/lib/genbaAuth";

// PATCH — update parsial (point/standard/sectionTitle/endMinutes).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Item checklist tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (body.point !== undefined) updateData.point = body.point;
    if (body.standard !== undefined) updateData.standard = body.standard;
    if (body.sectionTitle !== undefined) updateData.sectionTitle = body.sectionTitle;
    if (body.endMinutes !== undefined) {
      const em = Number(body.endMinutes);
      if (!Number.isFinite(em)) {
        return NextResponse.json(
          { success: false, error: "Jam tenggat tidak valid." },
          { status: 400 }
        );
      }
      updateData.endMinutes = Math.round(em);
    }

    await db.update(genbaScheduleItems).set(updateData).where(eq(genbaScheduleItems.id, id));

    const updated = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("PATCH /api/genba/schedule/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — SOFT delete (isActive:false), BUKAN hapus baris, supaya referensi
// id lama di entry genba historis (self-contained) tidak pernah putus.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { id } = await params;

    const existing = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Item checklist tidak ditemukan." },
        { status: 404 }
      );
    }

    await db
      .update(genbaScheduleItems)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(genbaScheduleItems.id, id));

    return NextResponse.json({ success: true, message: "Item checklist berhasil dinonaktifkan." });
  } catch (error: any) {
    console.error("DELETE /api/genba/schedule/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
