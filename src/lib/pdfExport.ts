"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { KaizenProject } from "@/types/kaizen";

/**
 * Estimate total size of images in a Kaizen project (in bytes).
 */
export function estimateTotalImagesSize(project: KaizenProject): {
  totalBytes: number;
  totalMB: number;
  exceedsLimit: boolean;
  imageCount: number;
} {
  let totalBytes = 0;
  let imageCount = 0;
  const c = project.content;

  if (!c) {
    return { totalBytes: 0, totalMB: 0, exceedsLimit: false, imageCount: 0 };
  }

  const inspectUrl = (url?: string) => {
    if (!url) return;
    imageCount++;
    if (url.startsWith("data:")) {
      // Base64 string length * 0.75 gives approx byte size
      totalBytes += Math.round(url.length * 0.75);
    } else {
      // Uploaded file URL (~2MB estimated average for uploaded photo)
      totalBytes += 2 * 1024 * 1024;
    }
  };

  // Step 1 images
  c.step1?.images?.forEach((img) => inspectUrl(img.url));
  // Step 4 fishbone image
  inspectUrl(c.step4?.fishboneImage);
  // Step 7 chart image
  inspectUrl(c.step7?.chartImage);
  // Step 8 before/after images
  inspectUrl(c.step8?.beforeUrl);
  inspectUrl(c.step8?.afterUrl);
  // Step 8 attachments
  c.step8?.attachments?.forEach((att) => inspectUrl(att.fileUrl));

  const totalMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
  const LIMIT_MB = 15;

  return {
    totalBytes,
    totalMB,
    exceedsLimit: totalMB > LIMIT_MB || imageCount >= 10,
    imageCount,
  };
}

/**
 * Optimized PDF export using html2canvas-pro with memory management:
 * 1. Scale 1.5 for crisp quality without OOM on mobile browsers.
 * 2. JPEG compression (0.85 quality) for lighter memory usage.
 * 3. Asynchronous delays between capturing sections to yield thread & trigger GC.
 * 4. Explicit canvas element dimension zeroing and nullifying.
 * 5. Fixed multi-page slice pagination logic.
 */
export async function exportElementToPdf(
  elementId: string,
  fileName: string = "Kaizen-Report.pdf"
) {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Element #${elementId} not found`);
  }

  const origMaxWidth = container.style.maxWidth;
  const origMargin = container.style.margin;
  const origWidth = container.style.width;

  container.style.maxWidth = "900px";
  container.style.width = "900px";
  container.style.margin = "0";

  // Pause to allow layout stabilization
  await new Promise((r) => setTimeout(r, 150));

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 5;
  const marginTop = 8;
  const marginBottom = 12;
  const usableWidth = pageWidth - marginX * 2;
  const usableHeight = pageHeight - marginTop - marginBottom;

  const sections = container.querySelectorAll<HTMLElement>(":scope > *");

  let currentY = marginTop;
  let pageNum = 1;
  let isFirstElement = true;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.offsetHeight === 0 || section.offsetWidth === 0) continue;

    let canvas: HTMLCanvasElement | null = null;
    try {
      canvas = await html2canvas(section, {
        scale: 1.5, // Optimized scale to prevent OOM
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 900,
      });
    } catch (e) {
      console.warn("Failed to capture section", i, e);
      continue;
    }

    if (!canvas) continue;

    const imgData = canvas.toDataURL("image/jpeg", 0.85);
    const imgRatio = canvas.width / canvas.height;
    const imgWidthMm = usableWidth;
    const imgHeightMm = imgWidthMm / imgRatio;

    // --- CASE A: Section is taller than usable height (needs slicing) ---
    if (imgHeightMm > usableHeight) {
      const sliceHeightPx = (usableHeight / imgHeightMm) * canvas.height;
      let srcY = 0;
      const totalSrcHeight = canvas.height;
      let sliceIndex = 0;

      while (srcY < totalSrcHeight) {
        // If slice 1, 2, 3... OR slice 0 when page is not empty -> create new page
        if (sliceIndex > 0 || (!isFirstElement && currentY > marginTop + 5)) {
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

          pdf.addPage();
          pageNum++;
          currentY = marginTop;
        }
        isFirstElement = false;

        const remainingSrcH = totalSrcHeight - srcY;
        const thisSliceH = Math.min(sliceHeightPx, remainingSrcH);
        const thisSliceMmH = (thisSliceH / canvas.height) * imgHeightMm;

        let sliceCanvas: HTMLCanvasElement | null = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(thisSliceH);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, Math.floor(srcY), canvas.width, Math.ceil(thisSliceH),
            0, 0, canvas.width, Math.ceil(thisSliceH)
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.85);
        pdf.addImage(sliceData, "JPEG", marginX, currentY, imgWidthMm, thisSliceMmH);

        // Advance currentY on the page
        currentY += thisSliceMmH + 2;

        // Clean up slice canvas memory
        sliceCanvas.width = 0;
        sliceCanvas.height = 0;
        sliceCanvas = null;

        srcY += thisSliceH;
        sliceIndex++;
      }

      // Clean up section canvas memory
      canvas.width = 0;
      canvas.height = 0;
      canvas = null;

      // Yield event loop & allow GC
      await new Promise((r) => setTimeout(r, 80));
      continue;
    }

    // --- CASE B: Section fits on one page (normal case) ---
    if (currentY + imgHeightMm > pageHeight - marginBottom) {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

      pdf.addPage();
      pageNum++;
      currentY = marginTop;
    }

    isFirstElement = false;
    pdf.addImage(imgData, "JPEG", marginX, currentY, imgWidthMm, imgHeightMm);
    currentY += imgHeightMm + 2;

    // Clean up main section canvas memory
    canvas.width = 0;
    canvas.height = 0;
    canvas = null;

    // Yield event loop & allow GC
    await new Promise((r) => setTimeout(r, 80));
  }

  // Footer for last page
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

  // Restore container styles
  container.style.maxWidth = origMaxWidth;
  container.style.width = origWidth;
  container.style.margin = origMargin;

  pdf.save(fileName);
}
