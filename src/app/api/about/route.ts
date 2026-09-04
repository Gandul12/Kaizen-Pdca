import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { aboutContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { timingSafeCompare } from "@/lib/password";
import { checkRateLimit } from "@/lib/requestHelpers";

function getAdminPassword(): string {
  const envPw = process.env.ADMIN_PASSWORD;
  if (envPw) return envPw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD environment variable is required in production.");
  }
  return "admin123";
}

export async function GET() {
  try {
    await ensureSchema();
    const rows = await db.select().from(aboutContent).where(eq(aboutContent.id, "main")).limit(1);

    if (!rows.length) {
      // Fallback default
      return NextResponse.json({
        success: true,
        data: {
          id: "main",
          title: "Dari Mana Ide Ini Muncul",
          narrative: "Website ini dibangun dari pengalaman nyata menghadapi tantangan efisiensi dan standarisasi proses manufaktur di lapangan. Berangkat dari kebutuhan akan alat dokumentasi improvement yang terstruktur, fleksibel, dan mudah diakses tim tanpa hambatan birokrasi, sistem PDCA 8 Langkah ini dirancang untuk memastikan setiap perbaikan dapat terukur dan terstandardisasi dengan konsisten.",
          authorName: "Praktisi Lean & Improvement",
          authorRole: "Industrial Engineer & Continuous Improvement Specialist",
          avatarUrl: "",
          achievements: [
            { label: "Peningkatan Kapasitas", value: "158%" },
            { label: "Pengurangan Cycle Time", value: "61%" },
            { label: "Siklus Kaizen PDCA", value: "8 Steps" },
          ],
        },
      });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "admin", 10, 15 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { password, title, narrative, authorName, authorRole, avatarUrl, achievements } = body;

    let adminPw: string;
    try {
      adminPw = getAdminPassword();
    } catch {
      return NextResponse.json({ success: false, error: "ADMIN_PASSWORD belum dikonfigurasi." }, { status: 503 });
    }

    if (!password || !timingSafeCompare(password, adminPw)) {
      return NextResponse.json({ success: false, error: "Password admin salah." }, { status: 403 });
    }

    const updateData = {
      title: title || "Dari Mana Ide Ini Muncul",
      narrative: narrative || "",
      authorName: authorName || "Praktisi Lean & Improvement",
      authorRole: authorRole || "Continuous Improvement Specialist",
      avatarUrl: avatarUrl || "",
      achievements: achievements || [],
      updatedAt: new Date(),
    };

    const existing = await db.select().from(aboutContent).where(eq(aboutContent.id, "main")).limit(1);

    if (existing.length > 0) {
      await db.update(aboutContent).set(updateData).where(eq(aboutContent.id, "main"));
    } else {
      await db.insert(aboutContent).values({ id: "main", ...updateData });
    }

    return NextResponse.json({ success: true, data: updateData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
