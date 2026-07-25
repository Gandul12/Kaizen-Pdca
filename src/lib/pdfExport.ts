"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Improved PDF export using html2canvas-pro (supports oklch/oklab from Tailwind v4).
 * Captures each <section> separately to avoid cutoff.
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

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 900,
      });
    } catch (e) {
      console.warn("Failed to capture section", i, e);
      continue;
    }

    const imgData = canvas.toDataURL("image/png");
    const imgRatio = canvas.width / canvas.height;
    const imgWidthMm = usableWidth;
    const imgHeightMm = imgWidthMm / imgRatio;

    if (imgHeightMm > usableHeight) {
      const sliceHeightPx = (usableHeight / imgHeightMm) * canvas.height;
      let srcY = 0;
      const totalSrcHeight = canvas.height;

      while (srcY < totalSrcHeight) {
        if (!isFirstElement && currentY > marginTop) {
          pdf.addPage();
          pageNum++;
          currentY = marginTop;
        }
        isFirstElement = false;

        const remainingSrcH = totalSrcHeight - srcY;
        const thisSliceH = Math.min(sliceHeightPx, remainingSrcH);
        const thisSliceMmH = (thisSliceH / canvas.height) * imgHeightMm;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(thisSliceH);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, Math.ceil(thisSliceH), 0, 0, canvas.width, Math.ceil(thisSliceH));
        }

        const sliceData = sliceCanvas.toDataURL("image/png");
        pdf.addImage(sliceData, "PNG", marginX, currentY, imgWidthMm, thisSliceMmH);

        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

        srcY += thisSliceH;
        currentY = marginTop;
      }
      currentY = marginTop;
      continue;
    }

    if (currentY + imgHeightMm > pageHeight - marginBottom) {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

      pdf.addPage();
      pageNum++;
      currentY = marginTop;
    }

    isFirstElement = false;
    pdf.addImage(imgData, "PNG", marginX, currentY, imgWidthMm, imgHeightMm);
    currentY += imgHeightMm + 2;
  }

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 4, { align: "center" });

  container.style.maxWidth = origMaxWidth;
  container.style.width = origWidth;
  container.style.margin = origMargin;

  pdf.save(fileName);
}
