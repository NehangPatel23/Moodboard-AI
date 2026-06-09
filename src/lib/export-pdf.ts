import type { jsPDF } from 'jspdf';
import type { ExportBlockCapture } from '@/lib/export-capture';
import { EXPORT_CAPTURE_WIDTH } from '@/lib/export-capture';

type BuildPdfOptions = {
  margin?: number;
  blockGap?: number;
};

function addSlicedImageToPdf(
  pdf: jsPDF,
  dataUrl: string,
  imageWidth: number,
  imageHeight: number,
  margin: number,
  maxWidth: number,
  maxHeight: number,
): void {
  const pdfWidth = maxWidth;
  const pdfHeight = (imageHeight * pdfWidth) / imageWidth;

  let heightLeft = pdfHeight;
  let position = margin;

  pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, pdfHeight);
  heightLeft -= maxHeight;

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight + margin;
    pdf.addPage();
    pdf.addImage(dataUrl, 'PNG', margin, position, pdfWidth, pdfHeight);
    heightLeft -= maxHeight;
  }
}

export function buildPdfFromExportBlocks(
  pdf: jsPDF,
  blocks: ExportBlockCapture[],
  options: BuildPdfOptions = {},
): void {
  const margin = options.margin ?? 10;
  const blockGap = options.blockGap ?? 3;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const topPadding = (48 / EXPORT_CAPTURE_WIDTH) * maxWidth;

  let cursorY = margin + topPadding;

  for (const block of blocks) {
    const pdfWidth = maxWidth;
    const pdfHeight = (block.height * pdfWidth) / block.width;

    if (pdfHeight > maxHeight) {
      if (cursorY > margin + topPadding) {
        pdf.addPage();
      }
      addSlicedImageToPdf(pdf, block.dataUrl, block.width, block.height, margin, maxWidth, maxHeight);
      cursorY = margin + topPadding;
      continue;
    }

    if (cursorY + pdfHeight > pageHeight - margin) {
      pdf.addPage();
      cursorY = margin + topPadding;
    }

    pdf.addImage(block.dataUrl, 'PNG', margin, cursorY, pdfWidth, pdfHeight);
    cursorY += pdfHeight + blockGap;
  }
}
