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

    const primaryColor = [17, 26, 46]; // #111A2E Navy
    const goldColor = [245, 158, 11];  // #F59E0B Gold
    const textDark = [33, 37, 41];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 42, 'F');

    // Studio Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.text('BHAKTI STUDIO', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('Event Production & Cinematography Services', 14, 27);
    doc.text('Surat, Gujarat, India | contact@bhaktistudio.com', 14, 33);

    // Document Title Badge (Right-aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL QUOTATION', 196, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    const orderCode = order.orderNumber || `BS-2026-${String(order.id || '00001').padStart(5, '0')}`;
    doc.text(`Quotation #: ${orderCode}`, 196, 27, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 33, { align: 'right' });

    // Client & Event Information Section
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CLIENT & EVENT DETAILS', 14, 52);

    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.6);
    doc.line(14, 54, 70, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Event Type: ${order.eventType || 'Event Production'}`, 14, 61);
    doc.text(`Venue / Location: ${order.venueAddress || 'Surat'}`, 14, 67);
    doc.text(`Event Date: ${order.eventDate ? new Date(order.eventDate).toLocaleDateString('en-IN') : 'Scheduled Date'}`, 14, 73);

    // Parse Items Table
    const quotation = order.quotations?.[0] || order.quotation || {};
    const itemsList = quotation.items || order.orderItems || order.items || [
      { name: order.eventType || 'Event Setup & Coverage', quantity: 1, rate: order.grandTotal || order.totalAmount || 43660 }
    ];

    const days = Number(order.totalDays || 1);

    const tableRows = itemsList.map((it, idx) => {
      const name = it.name || it.serviceName || it.title || `Service Item #${idx + 1}`;
      const isSqFt = it.unit === 'sqft' || name.toLowerCase().includes('led') || (it.serviceName || '').toLowerCase().includes('led');
      const width = Number(it.widthFt || it.ledWidth || it.width || (isSqFt ? order.ledWidthFeet : 0) || 0);
      const height = Number(it.heightFt || it.ledHeight || it.height || (isSqFt ? order.ledHeightFeet : 0) || 0);
      
      const qty = isSqFt && width > 0 && height > 0 ? (width * height) : Number(it.quantity || it.qty || 1);
      const qtyString = isSqFt ? `${qty} sq ft` : `${qty}`;
      
      const rate = Number(it.rate || it.unitPrice || it.price || it.finalRate || it.estimatedRate || 0);
      const total = qty * rate * days;
      
      return [idx + 1, name, qtyString, `₹${rate.toLocaleString('en-IN')}`, `₹${total.toLocaleString('en-IN')}`];
    });

    autoTable(doc, {
      startY: 82,
      head: [['#', 'Item / Service Description', 'Qty', 'Unit Rate (₹)', 'Amount (₹)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [245, 158, 11],
        fontStyle: 'bold',
        fontSize: 9.5
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        textColor: textDark
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 34, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Financial Breakdown Calculations
    let itemsSubtotal = 0;
    itemsList.forEach((it) => {
      const name = it.name || it.serviceName || it.title || '';
      const isSqFt = it.unit === 'sqft' || name.toLowerCase().includes('led') || (it.serviceName || '').toLowerCase().includes('led');
      const width = Number(it.widthFt || it.ledWidth || it.width || (isSqFt ? order.ledWidthFeet : 0) || 0);
      const height = Number(it.heightFt || it.ledHeight || it.height || (isSqFt ? order.ledHeightFeet : 0) || 0);
      const qty = isSqFt && width > 0 && height > 0 ? (width * height) : Number(it.quantity || it.qty || 1);
      const rate = Number(it.rate || it.unitPrice || it.price || it.finalRate || it.estimatedRate || 0);
      itemsSubtotal += qty * rate * days;
    });

    const setupCost = Number(quotation.setupFee || quotation.setupCost || 0);
    const logisticsCost = Number(quotation.transportFee || quotation.transportCost || quotation.logisticsCost || 0);
    const techSupportCost = Number(quotation.technicianFee || quotation.technicianCost || quotation.techSupportCost || 0);
    const discount = Number(quotation.discounts || quotation.discount || 0);

    const totalBeforeDiscount = itemsSubtotal + setupCost + logisticsCost + techSupportCost;
    const taxableAmount = Math.max(0, totalBeforeDiscount - discount);
    const taxAmount = taxableAmount * 0.18;
    const grandTotal = taxableAmount + taxAmount;

    // Summary Box
    const boxHeight = (discount > 0 ? 44 : 38) + (setupCost > 0 ? 6 : 0) + (logisticsCost > 0 ? 6 : 0) + (techSupportCost > 0 ? 6 : 0);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, finalY, 76, boxHeight, 2, 2, 'F');

    let currentY = finalY + 6;

    // 1. Items Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text('Items Subtotal:', 125, currentY);
    doc.text(`₹${itemsSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
    currentY += 6;

    // 2. Setup & Rigging
    if (setupCost > 0) {
      doc.text('Setup & Rigging:', 125, currentY);
      doc.text(`+ ₹${setupCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
      currentY += 6;
    }

    // 3. Transport & Logistics
    if (logisticsCost > 0) {
      doc.text('Transport & Logistics:', 125, currentY);
      doc.text(`+ ₹${logisticsCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
      currentY += 6;
    }

    // 4. Technician Support
    if (techSupportCost > 0) {
      doc.text('Technician Support:', 125, currentY);
      doc.text(`+ ₹${techSupportCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
      currentY += 6;
    }

    // 5. Discount
    if (discount > 0) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text('Discount:', 125, currentY);
      doc.text(`- ₹${discount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
      doc.setTextColor(...textDark);
      currentY += 6;
    }

    // 6. GST
    doc.text('GST (18%):', 125, currentY);
    doc.text(`+ ₹${taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, currentY, { align: 'right' });
    currentY += 8;

    // Line separator before Grand Total
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(122, currentY - 3, 194, currentY - 3);

    // 7. Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('Grand Total:', 125, currentY);
    doc.setTextColor(217, 119, 6); // Gold
    doc.text(`₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    // Terms & Conditions Footer
    const footerY = finalY + boxHeight + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text('Terms & Payment Details:', 14, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('1. 30% advance required to confirm crew & equipment lock.', 14, footerY + 6);
    doc.text('2. Remaining balance payable post-event execution.', 14, footerY + 11);
    doc.text('3. This is a computer generated quotation by Bhakti Studio.', 14, footerY + 16);

    // Save and Trigger Download
    doc.save(`Bhakti_Studio_Quotation_${orderCode}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Failed to generate PDF. Check console for details.');
  }
};
