import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadQuotationPdf = (order) => {
  try {
    if (!order) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Brand Palette
    const navyDark = [11, 17, 32];     // #0B1120
    const navyHeader = [17, 26, 46];   // #111A2E
    const goldPrimary = [245, 158, 11]; // #F59E0B
    const textDark = [15, 23, 42];     // Slate 900
    const textMuted = [100, 116, 139];  // Slate 500
    const bgLight = [248, 250, 252];    // Slate 50

    // 1. TOP HEADER BANNER
    doc.setFillColor(...navyHeader);
    doc.rect(0, 0, 210, 44, 'F');

    // Studio Name & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...goldPrimary);
    doc.text('BHAKTI STUDIO', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text('PREMIUM EVENT PRODUCTION & CINEMATOGRAPHY', 14, 25);
    doc.text('Surat, Gujarat, India  |  contact@bhaktistudio.com', 14, 31);
    doc.text('GSTIN: 24AAACB0000A1Z5', 14, 37);

    // Document Title & Reference (Right Side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL QUOTATION', 196, 18, { align: 'right' });

    const orderCode = order.orderNumber || `BS-2026-${String(order.id || '00001').padStart(5, '0')}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Quotation Ref: ${orderCode}`, 196, 26, { align: 'right' });
    doc.text(`Issued Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 32, { align: 'right' });
    doc.text('Status: APPROVED & ISSUED', 196, 38, { align: 'right' });

    // Gold Divider Line
    doc.setDrawColor(...goldPrimary);
    doc.setLineWidth(0.8);
    doc.line(0, 44, 210, 44);

    // 2. CLIENT & EVENT DETAILS CARD
    doc.setFillColor(...bgLight);
    doc.roundedRect(14, 50, 182, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, 50, 182, 28, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...navyDark);
    doc.text('EVENT & CLIENT SUMMARY', 18, 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(`Event Type: ${order.eventType || 'Event Production'}`, 18, 65);
    doc.text(`Venue / Location: ${order.venueAddress || 'Surat / Gujarat'}`, 18, 71);

    const days = Number(order.durationDays || order.totalDays || 1);
    const startDateObj = order.startDate ? new Date(order.startDate) : (order.eventDate ? new Date(order.eventDate) : null);
    const endDateObj = order.endDate ? new Date(order.endDate) : startDateObj;

    let eventDateStr = startDateObj ? startDateObj.toLocaleDateString('en-IN') : 'Scheduled';
    if (days > 1 && endDateObj && startDateObj && endDateObj.getTime() !== startDateObj.getTime()) {
      eventDateStr = `${startDateObj.toLocaleDateString('en-IN')} - ${endDateObj.toLocaleDateString('en-IN')} (${days} Days)`;
    } else if (days > 1) {
      eventDateStr = `${eventDateStr} (${days} Days)`;
    }

    doc.text(`Event Span: ${eventDateStr}`, 115, 65);
    doc.text(`Payment Terms: 30% Advance Lock`, 115, 71);

    // 3. TABLE OF LINE ITEMS
    const quotation = order.quotations?.[0] || order.quotation || {};
    const itemsList = quotation.items || order.orderItems || order.items || [
      { name: order.eventType || 'Complete Event Setup', quantity: 1, rate: order.grandTotal || 43660 }
    ];

    const tableRows = itemsList.map((it, idx) => {
      const name = it.name || it.serviceName || it.title || `Production Service #${idx + 1}`;
      const isSqFt = it.unit === 'sqft' || name.toLowerCase().includes('led') || (it.serviceName || '').toLowerCase().includes('led');
      const width = Number(it.widthFt || it.ledWidth || it.width || (isSqFt ? order.ledWidthFeet : 0) || 0);
      const height = Number(it.heightFt || it.ledHeight || it.height || (isSqFt ? order.ledHeightFeet : 0) || 0);
      
      const qtyVal = isSqFt && width > 0 && height > 0 ? (width * height) : Number(it.quantity || it.qty || 1);
      const qtyStr = isSqFt ? `${qtyVal} sq ft` : `${qtyVal} ${qtyVal > 1 ? 'Units' : 'Unit'}`;
      const rateVal = Number(it.rate || it.unitPrice || it.price || it.finalRate || it.estimatedRate || 0);
      const totalVal = qtyVal * rateVal * days;

      return [
        idx + 1,
        name,
        qtyStr,
        `Rs. ${rateVal.toLocaleString('en-IN')}`,
        `${days} ${days > 1 ? 'Days' : 'Day'}`,
        `Rs. ${totalVal.toLocaleString('en-IN')}`
      ];
    });

    autoTable(doc, {
      startY: 84,
      head: [['#', 'Item / Service Description', 'Quantity / Area', 'Unit Rate (INR)', 'Duration', 'Amount (INR)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: navyHeader,
        textColor: [245, 158, 11],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.3
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      }
    });

    // 4. FINANCIAL BREAKDOWN & OVERHEADS SUMMARY
    const finalY = doc.lastAutoTable.finalY + 8;
    
    let calculatedItemsSubtotal = 0;
    itemsList.forEach((it) => {
      const name = it.name || it.serviceName || it.title || '';
      const isSqFt = it.unit === 'sqft' || name.toLowerCase().includes('led') || (it.serviceName || '').toLowerCase().includes('led');
      const width = Number(it.widthFt || it.ledWidth || it.width || (isSqFt ? order.ledWidthFeet : 0) || 0);
      const height = Number(it.heightFt || it.ledHeight || it.height || (isSqFt ? order.ledHeightFeet : 0) || 0);
      const qtyVal = isSqFt && width > 0 && height > 0 ? (width * height) : Number(it.quantity || it.qty || 1);
      const rateVal = Number(it.rate || it.unitPrice || it.price || it.finalRate || it.estimatedRate || 0);
      const lineTotal = qtyVal * rateVal * days;
      calculatedItemsSubtotal += lineTotal;
    });

    const setupCost = Number(quotation.setupFee ?? quotation.setupCost ?? order.setupCost ?? 3000);
    const transportCost = Number(quotation.transportFee ?? quotation.transportCost ?? quotation.logisticsCost ?? order.logisticsCost ?? 100);
    const techCost = Number(quotation.technicianFee ?? quotation.technicianCost ?? quotation.techSupportCost ?? order.techSupportCost ?? 2000);
    const discountVal = Number(quotation.discounts ?? quotation.discount ?? order.discount ?? 0);

    const totalOverheads = setupCost + transportCost + techCost;
    const baseTaxableAmount = Math.max(0, calculatedItemsSubtotal + totalOverheads - discountVal);
    const calculatedGst = baseTaxableAmount * 0.18;
    const calculatedGrandTotal = baseTaxableAmount + calculatedGst;

    // Summary Box Drawing
    const hasDiscount = discountVal > 0;
    const boxHeight = (hasDiscount ? 44 : 38) + (setupCost > 0 ? 5.5 : 0) + (transportCost > 0 ? 5.5 : 0) + (techCost > 0 ? 5.5 : 0);
    
    doc.setFillColor(...bgLight);
    doc.roundedRect(110, finalY, 86, boxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(110, finalY, 86, boxHeight, 2, 2, 'D');

    let rowY = finalY + 6;
    const renderSummaryRow = (label, valStr, isBold = false, color = textDark) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...color);
      doc.text(label, 114, rowY);
      doc.text(valStr, 192, rowY, { align: 'right' });
      rowY += 5.5;
    };

    renderSummaryRow('Equipment Subtotal:', `Rs. ${calculatedItemsSubtotal.toLocaleString('en-IN')}`);
    
    if (setupCost > 0) {
      renderSummaryRow('Setup & Rigging Charges:', `+ Rs. ${setupCost.toLocaleString('en-IN')}`);
    }
    if (transportCost > 0) {
      renderSummaryRow('Transport & Logistics:', `+ Rs. ${transportCost.toLocaleString('en-IN')}`);
    }
    if (techCost > 0) {
      renderSummaryRow('Technician Support:', `+ Rs. ${techCost.toLocaleString('en-IN')}`);
    }
    if (discountVal > 0) {
      renderSummaryRow('Special Discount:', `- Rs. ${discountVal.toLocaleString('en-IN')}`, false, [16, 185, 129]);
    }
    renderSummaryRow('GST (18% Inclusive):', `+ Rs. ${calculatedGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

    // Divider inside summary
    doc.setDrawColor(203, 213, 225);
    doc.line(114, rowY - 1, 192, rowY - 1);
    rowY += 3;

    // Grand Total Row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...navyDark);
    doc.text('Grand Payable Total:', 114, rowY);
    doc.setTextColor(217, 119, 6);
    doc.text(`Rs. ${calculatedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 192, rowY, { align: 'right' });

    // 5. TERMS & BANK SETTLEMENT SECTION (Bottom-Left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyDark);
    doc.text('Terms of Service & Settlement:', 14, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('1. 30% advance deposit confirms crew allocation and calendar booking.', 14, finalY + 12);
    doc.text('2. 70% remaining balance due immediately upon event completion.', 14, finalY + 17);
    doc.text('3. Power source & stage permissions must be arranged by the client venue.', 14, finalY + 22);
    doc.text('4. Quotation valid for 7 calendar days from the date of issue.', 14, finalY + 27);
    doc.text('5. Online payments accepted via UPI, Cards, and NetBanking.', 14, finalY + 32);

    // Footer Watermark
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Bhakti Studio -- Confidential & Proprietary Event Quotation', 105, 288, { align: 'center' });

    // Trigger Clean Download
    doc.save(`Bhakti_Studio_Quotation_${orderCode}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Failed to generate PDF. Check browser console.');
  }
};
