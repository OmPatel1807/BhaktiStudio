import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { updateOrder } from '../controllers/order.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== MULTI-DAY EVENT & ORDER EDIT LIFECYCLE INTEGRATION TEST ===");

  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (!customer) {
    console.error("No customer found in the database. Please seed the DB.");
    process.exit(1);
  }

  let service = await prisma.serviceCatalog.findFirst({ where: { category: 'DISPLAY' } });
  if (!service) {
    service = await prisma.serviceCatalog.create({
      data: {
        name: 'LED Wall P3.9',
        category: 'DISPLAY',
        description: 'LED Display Screen',
        baseRate: 150.0,
        setupCharge: 2000.0,
        pricingModel: 'SQFT',
        isActive: true
      }
    });
  }

  console.log("Creating multi-day order in DB...");
  const orderNumber = `BS-TEST-MDay-${Date.now().toString().slice(-4)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      eventType: 'Concert / Cultural Fest',
      eventDate: new Date('2026-11-27'),
      endDate: new Date('2026-11-29'),
      totalDays: 3,
      startTime: '10:00 AM',
      endTime: '10:00 PM',
      venueAddress: 'Bhakti Hall Mumbai',
      ledWidthFeet: 12,
      ledHeightFeet: 8,
      distanceKm: 15,
      status: 'SUBMITTED',
      paymentStatus: 'PENDING',
      orderItems: {
        create: [
          {
            serviceName: service.name,
            widthFt: 12,
            heightFt: 8,
            quantity: 1,
            estimatedRate: 12 * 8 * 150 * 3,
            finalRate: 12 * 8 * 150 * 3
          }
        ]
      },
      quotations: {
        create: {
          versionNumber: 1,
          subtotal: 43200 + 2000 + (15 * 50),
          setupFee: 2000,
          transportFee: 750,
          taxAmount: 45950 * 0.18,
          totalAmount: 45950 * 1.18,
          advanceFee: 45950 * 1.18 * 0.3
        }
      }
    },
    include: {
      orderItems: true,
      quotations: true
    }
  });

  console.log(`✅ Order Created: ${order.orderNumber}`);
  console.log(`   Event Date: 2026-11-27 to 2026-11-29 (totalDays: ${order.totalDays})`);
  console.log(`   Items Subtotal: ₹${order.quotations[0].subtotal}`);
  console.log(`   Grand Total: ₹${order.quotations[0].totalAmount}`);

  console.log("\nSimulating Customer 'Edit Order' Update to 4 days & 2 quantities...");
  
  const reqUpdate = {
    params: { id: order.id },
    user: { userId: customer.id, role: 'CUSTOMER' },
    body: {
      eventType: 'Concert / Cultural Fest',
      eventDate: '2026-11-27',
      endDate: '2026-11-30',
      totalDays: 4,
      startTime: '10:00 AM',
      endTime: '10:00 PM',
      venueAddress: 'Bhakti Hall Mumbai Updated',
      ledWidthFeet: 12,
      ledHeightFeet: 8,
      transportDistanceKm: 20,
      selectedServices: [
        { serviceId: service.id, name: service.name, quantity: 2 }
      ]
    }
  };

  let resData = null;
  const resUpdate = {
    status: (code) => {
      console.log(`   Response status: ${code}`);
      return resUpdate;
    },
    json: (data) => {
      resData = data;
      return resUpdate;
    }
  };

  await updateOrder(reqUpdate, resUpdate);

  if (resData && resData.success) {
    console.log("✅ Order Edit recalculated successfully!");
    const updated = resData.data;
    console.log(`   New Venue Address: ${updated.venueAddress}`);
    console.log(`   New totalDays: ${updated.totalDays}`);
    console.log(`   Updated Items Count: ${updated.orderItems.length}`);
    console.log(`   Updated Item Rate (1 LED for 4 Days): ₹${updated.orderItems[0].estimatedRate}`);
    console.log(`   Updated Version Number: ${updated.quotations[0].versionNumber}`);
    console.log(`   Updated Grand Total: ₹${updated.quotations[0].totalAmount}`);

    const expectedItemRate = 12 * 8 * 150 * 4;
    if (updated.orderItems[0].estimatedRate === expectedItemRate) {
      console.log("   ✅ ASSERTION PASSED: Item rate matches expected 4-day rate");
    } else {
      console.error(`   ❌ ASSERTION FAILED: Expected item rate ${expectedItemRate}, got ${updated.orderItems[0].estimatedRate}`);
    }

    if (updated.totalDays === 4) {
      console.log("   ✅ ASSERTION PASSED: totalDays updated correctly to 4");
    } else {
      console.error(`   ❌ ASSERTION FAILED: Expected totalDays 4, got ${updated.totalDays}`);
    }

    await prisma.order.delete({ where: { id: order.id } });
    console.log("Cleaned up test order.");
  } else {
    console.error("❌ Order edit failed:", resData);
  }

  await prisma.$disconnect();
}

run();
