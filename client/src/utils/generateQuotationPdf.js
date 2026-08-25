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

    const tableRows = itemsList.map((it, idx) => {
      const name = it.name || it.serviceName || it.title || `Service Item #${idx + 1}`;
      const qty = Number(it.quantity || it.qty || 1);
      const rate = Number(it.rate || it.unitPrice || it.price || it.finalRate || it.estimatedRate || 0);
      const total = Number(it.total || it.amount || (qty * rate));
      return [idx + 1, name, qty, `₹${rate.toLocaleString('en-IN')}`, `₹${total.toLocaleString('en-IN')}`];
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
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 34, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    const finalAmount = Number(quotation.grandTotal || quotation.totalAmount || order.grandTotal || order.totalAmount || 0);
    const subTotal = Number(quotation.subTotal || quotation.subtotal || (finalAmount / 1.18));
    const taxAmount = Number(quotation.taxAmount || (finalAmount - subTotal));

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, finalY, 76, 32, 2, 2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', 125, finalY + 8);
    doc.text(`₹${subTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, finalY + 8, { align: 'right' });

    doc.text('GST (18%):', 125, finalY + 15);
    doc.text(`₹${taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 190, finalY + 15, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryColor);
    doc.text('Grand Total:', 125, finalY + 25);
    doc.setTextColor(217, 119, 6);
    doc.text(`₹${finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 25, { align: 'right' });

    // Terms & Conditions Footer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text('Terms & Payment Details:', 14, finalY + 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('1. 30% advance required to confirm crew & equipment lock.', 14, finalY + 48);
    doc.text('2. Remaining balance payable post-event execution.', 14, finalY + 53);
    doc.text('3. This is a computer generated quotation by Bhakti Studio.', 14, finalY + 58);

    // Save and Trigger Download
    doc.save(`Bhakti_Studio_Quotation_${orderCode}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Failed to generate PDF. Check console for details.');
  }
};
