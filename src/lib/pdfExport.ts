import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function exportElementToPdf(
  elementId: string,
  fileName: string = "Kaizen-Report.pdf"
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  // Temporary styling for full width capturing
  const canvas = await html2canvas(element, {
    scale: 2, // high quality resolution
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");

  // A4 dimensions in mm
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210; // A4 width
  const pageHeight = 297; // A4 height
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}
