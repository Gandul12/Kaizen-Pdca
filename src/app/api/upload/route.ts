import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/db";
import { put } from "@vercel/blob";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { validateFileSignature } from "@/lib/fileSignature";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// SECURITY: sebelumnya juga mengizinkan .svg/.pdf/.doc/.docx/.xls/.xlsx —
// sudah dicek, TIDAK ADA satu pun caller /api/upload di seluruh app (step
// editor, genba) yang memakai selain foto (semua accept="image/*"). SVG
// berisiko stored-XSS (bisa berisi <script>, disajikan sebagai public URL),
// dan validasi docx/xlsx sebelumnya cuma cek magic-number ZIP generik —
// zip apa pun lolos asal namanya .docx. Dipersempit ke gambar saja.
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    // ── 1. Parse multipart form ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    // ── 2. Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file melebihi batas 5 MB." },
        { status: 400 }
      );
    }

    // ── 3. Validate extension ──
    const originalName = file.name || "upload";
    const ext = getExtension(originalName) || ".png";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipe file "${ext}" tidak diizinkan. Format yang didukung: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── 4. Validate file content (magic-number / signature check) ──
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const sigCheck = validateFileSignature(ext, fileBytes);
    if (!sigCheck.valid) {
      return NextResponse.json(
        { success: false, error: sigCheck.reason },
        { status: 400 }
      );
    }

    // ── 5. Generate unique filename ──
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const fileName = `${timestamp}-${uniqueId}${ext}`;

    let fileUrl = "";

    // ── 6. Try Vercel Blob if token is set, else fallback to local disk storage ──
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const uploadBlob = new Blob([fileBytes], { type: file.type || "application/octet-stream" });
        const blob = await put(`kaizen-uploads/${fileName}`, uploadBlob, {
          access: "public",
          addRandomSuffix: false,
        });
        fileUrl = blob.url;
      } catch (blobError: any) {
        console.warn("Vercel Blob upload failed, falling back to local disk storage:", blobError);
      }
    }

    // Fallback: save to local disk public/uploads/
    if (!fileUrl) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const filePath = path.join(UPLOAD_DIR, fileName);
      await fs.writeFile(filePath, Buffer.from(fileBytes));
      fileUrl = `/uploads/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah file." },
      { status: 500 }
    );
  }
}
