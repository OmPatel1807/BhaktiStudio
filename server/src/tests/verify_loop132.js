function computeLineItemPrice(item) {
  if (!item) return 0;
  const unitRate = Number(item.unitRate || item.baseRate || item.price || item.estimatedRate || item.finalRate || 0);
  const days = Number(item.days) || 1;
  const qty = Number(item.quantity) || 1;
  const width = Number(item.width || item.widthFt || 0);
  const height = Number(item.height || item.heightFt || 0);

  if (width > 0 && height > 0) {
    const area = width * height;
    const isTotalRate = unitRate > 500 && area > 1;
    const itemTotal = isTotalRate ? unitRate : (unitRate * area);
    return Math.round(itemTotal * days * qty * 100) / 100;
  }
  return Math.round(unitRate * qty * days * 100) / 100;
}

function computeEquipmentSubtotal(orderItems = []) {
  return Math.round(
    orderItems.reduce((sum, item) => sum + computeLineItemPrice(item), 0) * 100
  ) / 100;
}

function runTest() {
  console.log('=== LOOP 132: DETERMINISTIC LINE-ITEM DERIVATION & SUM TEST ===');

  const order = {
    durationDays: 3,
    totalDays: 3,
    ledWidthFeet: 12,
    ledHeightFeet: 8,
  };

  const sampleOrderItems = [
    {
      serviceName: 'Line Array Sound System',
      quantity: 2,
      days: 3,
      finalRate: 8000,
      price: 8000,
    },
    {
      serviceName: 'LED Wall P3.9',
      widthFt: 12,
      heightFt: 8,
      days: 3,
      quantity: 1,
      finalRate: 150,
      price: 150,
    }
  ];

  const totalEquipment = computeEquipmentSubtotal(sampleOrderItems);

  // Test the line item rendering loop derivation logic
  const renderedItems = sampleOrderItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const days = Number(item.days || order.durationDays || order.totalDays) || 1;
    const isArea = Boolean(item.pricingType === 'AREA_BASED' || (item.widthFt && item.heightFt) || (item.width && item.height));
    const width = Number(item.widthFt || item.width || (isArea ? (order.ledWidthFeet || 12) : 0));
    const height = Number(item.heightFt || item.height || (isArea ? (order.ledHeightFeet || 8) : 0));
    const sqft = isArea ? (width > 0 && height > 0 ? width * height : 96) : null;

    const itemTotal = computeLineItemPrice(item);

    let baseUnitRate = Number(item.baseRate || item.unitRate || 0);
    if (!baseUnitRate) {
      const rawRate = Number(item.finalRate || item.estimatedRate || item.price || item.rate || 0);
      if (isArea && sqft > 0) {
        baseUnitRate = rawRate > 500 ? Math.round(rawRate / sqft) : (rawRate || Math.round(itemTotal / (sqft * days * qty)));
      } else {
        baseUnitRate = rawRate || Math.round(itemTotal / (qty * days));
      }
    }

    return {
      name: item.serviceName,
      isArea,
      sqft,
      width,
      height,
      qty,
      days,
      baseUnitRate,
      itemTotal,
      formula: isArea && sqft > 0
        ? `${sqft} sq ft (${width}×${height} ft) @ ₹${baseUnitRate}/sqft${days > 1 ? ` × ${days} Days` : ''}`
        : `${qty} ${qty > 1 ? 'Units' : 'Unit'} × ₹${baseUnitRate}/day${days > 1 ? ` × ${days} Days` : ''}`,
    };
  });

  const sumOfRenderedTotals = renderedItems.reduce((acc, it) => acc + it.itemTotal, 0);

  console.log('Rendered Line Items:');
  renderedItems.forEach((it, idx) => {
    console.log(` [${idx + 1}] ${it.name}: ${it.formula} => ₹${it.itemTotal}`);
  });

  console.log('\nSum of Line Totals:', sumOfRenderedTotals);
  console.log('Equipment Subtotal:', totalEquipment);

  if (renderedItems[0].itemTotal !== 48000) {
    console.error(`❌ Item 1 calculation mismatch: got ${renderedItems[0].itemTotal}`);
    process.exit(1);
  }
  if (renderedItems[1].itemTotal !== 43200) {
    console.error(`❌ Item 2 calculation mismatch: got ${renderedItems[1].itemTotal}`);
    process.exit(1);
  }
  if (sumOfRenderedTotals !== totalEquipment || totalEquipment !== 91200) {
    console.error(`❌ Sum mismatch: sum=${sumOfRenderedTotals}, totalEquipment=${totalEquipment}`);
    process.exit(1);
  }

  console.log('✅ Deterministic formula derivation and line-item totals match 100%!');
  console.log('\nALL LOOP 132 TESTS COMPLETED SUCCESSFULLY!');
}

runTest();
