import { jsPDF } from 'jspdf';
import { Invoice, BusinessProfile, Customer } from '../types.ts';
import { format } from 'date-fns';
import QRCode from 'qrcode';

export const generateInvoicePDF = async (invoice: Invoice, profile: BusinessProfile | null, customer: Customer | undefined) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Margins & Coordinates Configuration
  const marginMode = invoice.margins || 'comfortable';
  const m = marginMode === 'compact' ? 12 : marginMode === 'spacious' ? 28 : 20;
  const rx = 210 - m; // Right-aligned x-coordinate
  const contentWidth = 210 - (m * 2);

  // 2. Color Palette
  const primary = (invoice as any).accentColor || '#FF4D57';
  const black = '#0F172A';
  const gray = '#64748B';

  // Helper HEX to RGB conversion
  const hexToRgb = (hex: string): [number, number, number] => {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) || 0;
    const g = parseInt(cleaned.substring(2, 4), 16) || 0;
    const b = parseInt(cleaned.substring(4, 6), 16) || 0;
    return [r, g, b];
  };

  const [prR, prG, prB] = hexToRgb(primary);

  // 3. Font Family Setup
  const fontMap: Record<string, string> = {
    'Inter': 'helvetica',
    'Space Grotesk': 'helvetica',
    'Playfair Display': 'times',
    'JetBrains Mono': 'courier',
  };
  const finalFont = fontMap[invoice.fontFamily || 'Inter'] || 'helvetica';

  // 4. Template-specific Header Accents
  const selTemplate = invoice.templateId || 'modern';
  
  if (selTemplate === 'luxury') {
    doc.setFillColor(31, 41, 55); // Slate Charcoal Top Edge
    doc.rect(0, 0, 210, 4, 'F');
  } else if (selTemplate === 'creative' || selTemplate === 'bold') {
    doc.setFillColor(prR, prG, prB); // Accent colored elegant Top Edge
    doc.rect(0, 0, 210, 4, 'F');
  }

  // 5. Branding & Logo
  let logoY = 15;
  if (profile?.logoUrl) {
    try {
      const isPng = profile.logoUrl.includes('png');
      const imgFormat = isPng ? 'PNG' : 'JPEG';
      doc.addImage(profile.logoUrl, imgFormat, m, logoY, 24, 24);
      logoY = 44; // Shift relative addresses down
    } catch (e) {
      console.error('Failed to embed brand logo in PDF:', e);
    }
  }

  // Business Name & Profile details
  const detailsYStart = profile?.logoUrl ? 17 : 15;
  const textLeftOffset = profile?.logoUrl ? m + 28 : m;

  doc.setFontSize(22);
  doc.setFont(finalFont, 'bold');
  
  if (selTemplate === 'bold' || selTemplate === 'creative') {
    doc.setTextColor(prR, prG, prB);
  } else if (selTemplate === 'luxury') {
    doc.setTextColor(31, 41, 55);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  doc.text(profile?.name || 'BUSINESS NAME', textLeftOffset, detailsYStart + 5);

  doc.setFontSize(8.5);
  doc.setFont(finalFont, 'normal');
  doc.setTextColor(gray);
  doc.text(profile?.address || 'Your Street, City', textLeftOffset, detailsYStart + 11);
  doc.text(profile?.email || 'email@company.com', textLeftOffset, detailsYStart + 15);
  
  const isShowTax = invoice.showTaxId !== false;
  if (profile?.taxId && isShowTax) {
    doc.text(`Tax ID: ${profile.taxId}`, textLeftOffset, detailsYStart + 19);
  }

  // Invoice Metallic Banner
  doc.setFontSize(26);
  doc.setTextColor(prR, prG, prB);
  doc.setFont(finalFont, 'bold');
  const titleX = (selTemplate === 'minimal' || selTemplate === 'corporate') ? textLeftOffset : rx - 50;
  const titleY = (selTemplate === 'minimal' || selTemplate === 'corporate') ? detailsYStart + 29 : detailsYStart + 5;
  doc.text('INVOICE', titleX, titleY);

  doc.setFontSize(9.5);
  doc.setFont(finalFont, 'bold');
  doc.setTextColor(black);
  doc.text(`NO: #${invoice.number}`, titleX, titleY + 7);

  doc.setFont(finalFont, 'normal');
  doc.setTextColor(gray);
  doc.text(`Date: ${format(invoice.date, 'MMM dd, yyyy')}`, titleX, titleY + 12);
  doc.text(`Due: ${format(invoice.dueDate, 'MMM dd, yyyy')}`, titleX, titleY + 17);

  const billingY = Math.max(logoY + 6, titleY + 23);
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.4);
  doc.line(m, billingY, rx, billingY);

  // 6. Customer Billed to Block
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.setFont(finalFont, 'bold');
  doc.text('BILLED TO', m, billingY + 10);

  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text(customer?.name || 'Client Name', m, billingY + 17);

  doc.setFontSize(8.5);
  doc.setFont(finalFont, 'normal');
  doc.setTextColor(gray);
  doc.text(customer?.address || 'Client Address', m, billingY + 23);
  doc.text(customer?.email || 'client@email.com', m, billingY + 27);

  // 7. Invoice Items Table Construction
  const tableTop = billingY + 38;

  // Helper to draw headers
  const drawHeaders = (yCoord: number) => {
    if (selTemplate === 'luxury') {
      doc.setFillColor(31, 41, 55); // Rich charcoal background header
      doc.rect(m, yCoord, rx - m, 9, 'F');
      doc.setTextColor('#FFFFFF');
    } else if (selTemplate === 'minimal') {
      // Elegant line styling, white header background
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(m, yCoord, rx, yCoord);
      doc.line(m, yCoord + 9, rx, yCoord + 9);
      doc.setTextColor(black);
    } else if (selTemplate === 'classic') {
      doc.setFillColor(0, 0, 0);
      doc.rect(m, yCoord, rx - m, 10, 'F');
      doc.setTextColor('#FFFFFF');
    } else {
      doc.setFillColor(prR, prG, prB); // Brand primary color headers
      doc.rect(m, yCoord, rx - m, 9, 'F');
      doc.setTextColor('#FFFFFF');
    }

    doc.setFontSize(8);
    doc.setFont(finalFont, 'bold');
    
    doc.text('DESCRIPTION', m + 4, yCoord + 6);
    doc.text('QTY', rx - 68, yCoord + 6, { align: 'center' });
    doc.text('PRICE', rx - 48, yCoord + 6, { align: 'right' });
    doc.text('TAX %', rx - 28, yCoord + 6, { align: 'right' });
    doc.text('AMOUNT', rx - 4, yCoord + 6, { align: 'right' });
  };

  // Draw headers initially
  drawHeaders(tableTop);

  // Draw Items rows
  let currentY = tableTop + 15;
  
  invoice.items.forEach((item) => {
    const q = parseFloat(String(item.quantity)) || 0;
    const p = parseFloat(String(item.price)) || 0;
    const d = parseFloat(String(item.discount)) || 0;
    const t = parseFloat(String(item.taxRate)) || 0;
    
    const sub = q * p;
    const discAmt = sub * (d / 100);
    const afterDisc = sub - discAmt;
    const taxAmt = afterDisc * (t / 100);
    const lineTotal = afterDisc + taxAmt;

    const rowHeight = d > 0 ? 12 : 10;

    // Check if drawing this row would exceed printable area of current page
    if (currentY + rowHeight > 297 - m - 20) {
      doc.addPage();
      // Apply template top edge accents if relevant
      if (selTemplate === 'luxury') {
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, 210, 4, 'F');
      } else if (selTemplate === 'creative' || selTemplate === 'bold') {
        doc.setFillColor(prR, prG, prB);
        doc.rect(0, 0, 210, 4, 'F');
      }
      const newTableTop = m + 10;
      drawHeaders(newTableTop);
      currentY = newTableTop + 15;
    }

    doc.setTextColor(black);
    doc.setFont(finalFont, 'bold');
    doc.setFontSize(8.5);
    doc.text(item.description || 'Service Description', m + 4, currentY);

    const qtyStr = item.quantity.toString();
    const priceStr = `$${item.price.toFixed(2)}`;
    const taxStr = `${item.taxRate}%`;

    doc.setFont(finalFont, 'normal');
    doc.setTextColor(gray);
    doc.text(qtyStr, rx - 68, currentY, { align: 'center' });
    doc.text(priceStr, rx - 48, currentY, { align: 'right' });
    doc.text(taxStr, rx - 28, currentY, { align: 'right' });
    
    doc.setFont(finalFont, 'bold');
    doc.setTextColor(black);
    doc.text(`$${lineTotal.toFixed(2)}`, rx - 4, currentY, { align: 'right' });

    // Optional Discount tag rendering
    if (d > 0) {
      doc.setFont(finalFont, 'italic');
      doc.setFontSize(7);
      doc.setTextColor(prR, prG, prB);
      doc.text(`(Includes ${d}% Coupon Discount)`, m + 4, currentY + 4);
    }

    currentY += rowHeight;
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.2);
    doc.line(m, currentY - 5, rx, currentY - 5);
  });

  // 8. Totals block computation & layout with safety height boundary verification
  if (currentY + 30 > 297 - m - 20) {
    doc.addPage();
    if (selTemplate === 'luxury') {
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, 210, 4, 'F');
    } else if (selTemplate === 'creative' || selTemplate === 'bold') {
      doc.setFillColor(prR, prG, prB);
      doc.rect(0, 0, 210, 4, 'F');
    }
    currentY = m + 10;
  }

  const totalBoxY = currentY + 5;
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.setFont(finalFont, 'bold');
  doc.text('SUBTOTAL', rx - 60, totalBoxY);
  doc.text('TAX TOTAL', rx - 60, totalBoxY + 6);
  
  doc.setTextColor(black);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, rx - 4, totalBoxY, { align: 'right' });
  doc.text(`$${invoice.taxTotal.toFixed(2)}`, rx - 4, totalBoxY + 6, { align: 'right' });
  
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(rx - 65, totalBoxY + 10, rx, totalBoxY + 10);
  
  doc.setFontSize(13);
  doc.setTextColor(black);
  doc.text('TOTAL', rx - 60, totalBoxY + 17);
  doc.setTextColor(prR, prG, prB);
  doc.text(`$${invoice.total.toFixed(2)}`, rx - 4, totalBoxY + 17, { align: 'right' });

  const totalEndY = totalBoxY + 22;

  // 9. Interactive Dynamic Bank Transfer, QR Pay, Signatory, and Notes Flow
  const isShowBank = invoice.showBankDetails !== false;
  const hasBank = isShowBank && (profile?.bankAccount || profile?.ifscCode);
  const isShowSignature = invoice.showSignature !== false;
  const hasSig = isShowSignature;

  // Compute QR UPI payload
  let qrText = '';
  const amt = invoice.total.toFixed(2);
  const currency = invoice.currency || profile?.currency || 'USD';
  if (profile?.upiId) {
    const payeeName = profile.name || 'Merchant';
    const note = `Invoice ${invoice.number}`;
    qrText = `upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(payeeName)}&am=${amt}&cu=${currency}&tn=${encodeURIComponent(note)}`;
  }
  const hasQr = !!qrText;

  // Let's measure left-side and right-side columns heights dynamically
  const leftColHeight = (hasBank ? 34 : 0) + (hasQr ? 30 : 0);
  const rightColHeight = hasSig ? 32 : 0;
  const bottomPanelsHeight = Math.max(leftColHeight, rightColHeight);
  const totalSectionHeightNeeded = bottomPanelsHeight + 35; // Panel height plus notes spacing

  let bottomSectionY = totalEndY + 8;
  const spaceLeft = 297 - m - 20 - bottomSectionY;

  // Check if bottom section panels fit in remainder of the current page
  if (totalSectionHeightNeeded > spaceLeft) {
    doc.addPage();
    if (selTemplate === 'luxury') {
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, 210, 4, 'F');
    } else if (selTemplate === 'creative' || selTemplate === 'bold') {
      doc.setFillColor(prR, prG, prB);
      doc.rect(0, 0, 210, 4, 'F');
    }
    bottomSectionY = m + 10;
  }

  // Flow coordinates sequentially inside the bottom section
  let leftY = bottomSectionY;
  let rightY = bottomSectionY;

  if (hasBank) {
    const wireY = leftY;
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(235, 235, 240);
    doc.roundedRect(m, wireY, 105, 28, 2, 2, 'FD');

    doc.setFont(finalFont, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(black);
    doc.text('SETTLEMENT DIRECT BANK INFO', m + 4, wireY + 5);

    doc.setFont(finalFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(gray);
    doc.text(`Bank Branch: ${profile.bankName || 'N/A'}`, m + 4, wireY + 10);
    doc.text(`Account Holder: ${profile.holderName || profile?.name || 'N/A'}`, m + 4, wireY + 14);
    doc.text(`A/C Number: ${profile.bankAccount || 'N/A'}`, m + 4, wireY + 18);
    doc.text(`IFSC / SWIFT: ${profile.ifscCode || 'N/A'}`, m + 4, wireY + 22);

    leftY += 34;
  }

  if (hasQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 2,
        width: 150,
      });

      const qrBoxY = leftY;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(240, 240, 245);
      doc.roundedRect(m, qrBoxY, 105, 26, 2, 2, 'FD');

      doc.addImage(qrDataUrl, 'PNG', m + 2, qrBoxY + 2, 22, 22);

      doc.setFont(finalFont, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(black);
      doc.text('SCAN TO PAY INSTANTLY', m + 26, qrBoxY + 7);

      doc.setFont(finalFont, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(gray);
      doc.text('Scan from GPay, PhonePe, Paytm or banking app.', m + 26, qrBoxY + 12);
      
      doc.setFont(finalFont, 'bold');
      doc.setTextColor(prR, prG, prB);
      doc.text(`UPI Id: ${profile?.upiId}`, m + 26, qrBoxY + 18);

      leftY += 30;
    } catch (e) {
      console.error('Failed to encode QR Gateway PDF:', e);
    }
  }

  if (hasSig) {
    const sigY = rightY;
    doc.setFont(finalFont, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(gray);
    doc.text('AUTHORIZED SIGNATORY', rx - 48, sigY + 22);

    if (profile?.signature) {
      try {
        const isPng = profile.signature.includes('png');
        const f = isPng ? 'PNG' : 'JPEG';
        doc.addImage(profile.signature, f, rx - 48, sigY - 2, 38, 14);
      } catch (e) {
        console.error('Unable to embed base64 signature seal:', e);
      }
    } else {
      doc.setDrawColor(220, 220, 220);
      doc.setFont(finalFont, 'italic');
      doc.text('[ Authorized Stamp Seal ]', rx - 46, sigY + 12);
    }
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(rx - 55, sigY + 16, rx - 5, sigY + 16);

    rightY += 32;
  }

  // Flow terms & special notes section perfectly beneath columns
  const termsY = Math.max(leftY, rightY) + 5;

  doc.setFont(finalFont, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(black);
  doc.text('TERMS & CONDITIONS / NOTES', m, termsY);

  doc.setFont(finalFont, 'italic');
  doc.setTextColor(gray);
  doc.setFontSize(7.5);
  doc.text(`Notes: ${invoice.notes || 'No special notes.'}`, m, termsY + 5, { maxWidth: contentWidth });
  doc.text(`Terms: ${invoice.terms || 'Payment upon receipt.'}`, m, termsY + 11, { maxWidth: contentWidth });

  // 10. Multi-page Footer Brand Marker & Page Numbering Decorator
  const pageCount = doc.getNumberOfPages();
  for (let idx = 1; idx <= pageCount; idx++) {
    doc.setPage(idx);
    doc.setFont(finalFont, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generative PDF Document by NovaBill Suite | Page ${idx} of ${pageCount}`, 105, 297 - 8, { align: 'center' });
  }

  // Save pdf
  doc.save(`Invoice_${invoice.number}.pdf`);
};
