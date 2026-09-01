export interface DocxImageBuffer {
  buffer: Uint8Array;
  extension: "jpg" | "png";
}

/**
 * Mengambil gambar dari URL (Vercel Blob / uploads lokal / base64 data URL)
 * dan mengembalikannya sebagai buffer siap pakai untuk `ImageRun` docx.
 * Dipindahkan dari `docxExport.ts` supaya bisa dipakai ulang oleh
 * `genbaDocxExport.ts` tanpa duplikasi kode — logika tidak diubah sama sekali.
 */
export async function imageUrlToBuffer(url: string): Promise<DocxImageBuffer | null> {
  try {
    if (!url) return null;

    // Handle base64 data URLs (legacy)
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      if (parts.length < 2) return null;
      const header = parts[0];
      const base64Data = parts[1];
      let extension: "jpg" | "png" = "png";
      if (header.includes("jpeg") || header.includes("jpg")) extension = "jpg";
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { buffer: bytes, extension };
    }

    // Handle file URLs (/uploads/xxx.png)
    const fullUrl = url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;
    const resp = await fetch(fullUrl);
    if (!resp.ok) return null;
    const arrayBuf = await resp.arrayBuffer();
    const ext = url.split(".").pop()?.toLowerCase() || "png";
    const extension: "jpg" | "png" = (ext === "jpg" || ext === "jpeg") ? "jpg" : "png";
    return { buffer: new Uint8Array(arrayBuf), extension };
  } catch (e) {
    return null;
  }
}
