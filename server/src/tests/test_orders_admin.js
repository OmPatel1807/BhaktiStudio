import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testAdminOrdersFetch() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      quotations: true,
    },
  });
  console.log('Total Database Orders:', orders.length);
  orders.forEach((o) => {
    console.log(`- Order #${o.orderNumber} | Customer: ${o.customer?.name} | Event: ${o.eventType} | Status: ${o.status}`);
  });
  await prisma.$disconnect();
}

testAdminOrdersFetch();
