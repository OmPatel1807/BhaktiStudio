import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateQuotationPdf = (order, quotation) => {
  const doc = new jsPDF();

  // Branding colors
  const primaryColor = [17, 26, 46]; // Dark Blue #111A2E
  const accentColor = [245, 158, 11]; // Gold #F59E0B
  const textColor = [51, 65, 85]; // Dark Slate

  // 1. Header with luxury theme background banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  // Title text in Gold
  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BHAKTI STUDIO', 15, 20);

  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('PREMIUM EVENT PRODUCTION & LED RENTALS', 15, 28);

  doc.setFontSize(14);
  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL QUOTATION', 140, 25);

  // Gold accent bar separator
  doc.setFillColor(...accentColor);
  doc.rect(0, 40, 210, 3, 'F');

  // 2. Metadata Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION DETAILS', 15, 55);
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 57, 195, 57);

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Format date helper
  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'TBD';
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr || 'TBD';
    }
  };

  // Left Column
  doc.text(`Quotation ID: QT-${order.orderNumber || 'BS-2026-00001'}`, 15, 65);
  doc.text(`Client Name: ${order.customer?.name || order.customerName || 'Valued Customer'}`, 15, 72);
  doc.text(`Email: ${order.customer?.email || 'N/A'}`, 15, 79);

  // Right Column
  doc.text(`Event Type: ${order.eventType || 'N/A'}`, 120, 65);
  doc.text(`Event Date: ${formatDate(order.eventDate)}`, 120, 72);
  doc.text(`Venue Address: ${order.venueAddress || 'N/A'}`, 120, 79);

  // 3. Line Items Table using autoTable
  const items = order.orderItems || order.items || order.services || [];
  const tableRows = [];

  // Equipment / Service line items
  items.forEach((item, index) => {
    const name = item.serviceName || item.name || item.service?.name || 'Service Item';
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.finalRate || item.rate || item.estimatedRate || item.baseRate || 0);
    const days = Number(item.days || 1);
    const itemTotal = qty * rate * days;

    tableRows.push([
      `${index + 1}. ${name}${days > 1 ? ` (${days} days)` : ''}`,
      qty,
      `INR ${rate.toLocaleString('en-IN')}`,
      `INR ${itemTotal.toLocaleString('en-IN')}`
    ]);
  });

  // Additional Fees as rows if present
  if (quotation && Number(quotation.setupFee) > 0) {
    tableRows.push(['Setup & Rigging Charges', '-', '-', `INR ${Number(quotation.setupFee).toLocaleString('en-IN')}`]);
  }
  if (quotation && Number(quotation.transportFee) > 0) {
    tableRows.push(['Transport & Logistics', '-', '-', `INR ${Number(quotation.transportFee).toLocaleString('en-IN')}`]);
  }
  if (quotation && Number(quotation.technicianFee) > 0) {
    tableRows.push(['Technician Support', '-', '-', `INR ${Number(quotation.technicianFee).toLocaleString('en-IN')}`]);
  }

  doc.autoTable({
    startY: 90,
    head: [['Description', 'Qty', 'Unit Rate', 'Amount']],
    body: tableRows,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: 15, right: 15 }
  });

  // Get start Y for the summary block
  let finalY = doc.previousAutoTable.finalY + 12;

  // Check if we need to add a page to fit the summary and terms
  if (finalY > 210) {
    doc.addPage();
    finalY = 20;
  }

  // 4. Summary Box (Right aligned)
  const summaryX = 120;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text('SUMMARY OF CHARGES', summaryX, finalY);
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY + 2, 195, finalY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.setFontSize(9);

  let currentY = finalY + 8;
  const subtotal = Number(quotation?.subtotal || order.grandTotal || 0);
  doc.text('Gross Subtotal:', summaryX, currentY);
  doc.text(`INR ${subtotal.toLocaleString('en-IN')}`, 195, currentY, { align: 'right' });

  if (quotation && Number(quotation.discounts) > 0) {
    currentY += 6;
    doc.text('Discount Applied:', summaryX, currentY);
    doc.text(`- INR ${Number(quotation.discounts).toLocaleString('en-IN')}`, 195, currentY, { align: 'right' });
  }

  const taxAmount = Number(quotation?.taxAmount || 0);
  currentY += 6;
  doc.text('GST (18%):', summaryX, currentY);
  doc.text(`INR ${taxAmount.toLocaleString('en-IN')}`, 195, currentY, { align: 'right' });

  const totalAmount = Number(quotation?.totalAmount || order.grandTotal || 0);
  currentY += 8;
  doc.setFillColor(...primaryColor);
  doc.rect(summaryX, currentY - 5, 75, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Payable Amount:', summaryX + 2, currentY);
  doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, 195, currentY, { align: 'right' });

  // 5. Terms & Bank details (Left aligned)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PAYMENT TERMS & BANK DETAILS', 15, finalY);
  doc.setLineWidth(0.5);
  doc.line(15, finalY + 2, 105, finalY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.setFontSize(8.5);

  let termsY = finalY + 8;
  doc.text('• Advance required to confirm: 30% of total.', 15, termsY);
  doc.text('• Balance payment due on setup completion.', 15, termsY + 5);
  doc.text('• Bank Name: HDFC Bank Ltd', 15, termsY + 12);
  doc.text('• Account Name: Bhakti Studio Production', 15, termsY + 17);
  doc.text('• A/C Number: 50200088921822', 15, termsY + 22);
  doc.text('• IFSC Code: HDFC0000180', 15, termsY + 27);

  // Footer note
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.text('Thank you for choosing Bhakti Studio! This is a system-generated quotation.', 15, 282);

  doc.save(`Quotation_Order_${order.orderNumber || 'BS'}.pdf`);
};
