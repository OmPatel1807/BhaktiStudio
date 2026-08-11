import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bhakti Studio Database Seed...');

  // 1. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'ompatel.666to18@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'ompatel.666to18@gmail.com',
      name: 'System Admin',
      phone: '+91 7016025373',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });
  console.log(`✅ Admin User seeded: ${adminUser.email}`);

  // 2. Seed Worker Users & Profiles
  const workersData = [
    {
      email: 'worker.led@bhaktistudio.com',
      name: 'Ramesh LED Tech',
      phone: '+91 98765 11111',
      specialization: ['LED_TECHNICIAN', 'GENERAL_TECHNICIAN'],
      experienceYrs: 5,
    },
    {
      email: 'worker.sound@bhaktistudio.com',
      name: 'Suresh Sound Eng',
      phone: '+91 98765 22222',
      specialization: ['SOUND_ENGINEER', 'LIGHTING_TECHNICIAN'],
      experienceYrs: 7,
    },
    {
      email: 'worker.camera@bhaktistudio.com',
      name: 'Priya Camera Op',
      phone: '+91 98765 33333',
      specialization: ['CAMERA_OPERATOR', 'STREAMING_OPERATOR'],
      experienceYrs: 4,
    },
  ];

  for (const w of workersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: w.email },
      include: { workerProfile: true },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          email: w.email,
          name: w.name,
          phone: w.phone,
          role: 'WORKER',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.name}`,
          workerProfile: {
            create: {
              specialization: w.specialization,
              experienceYrs: w.experienceYrs,
            },
          },
        },
        include: { workerProfile: true },
      });
      console.log(`✅ Worker seeded: ${user.name} (${user.email})`);
    } else {
      console.log(`✅ Worker already exists: ${existingUser.name} (${existingUser.email})`);
    }
  }

  // 3. Seed Service Catalog Items & Equipment (100% Idempotent with Upsert)
  const catalogItems = [
    {
      name: 'LED Wall P3.9',
      category: 'Display',
      description: 'High definition outdoor/indoor P3.9 LED video wall',
      pricingModel: 'AREA_BASED',
      baseRate: 150.0,
      setupCharge: 2000.0,
      equipment: [
        { assetTag: 'LED-P39-CAB-01', condition: 'EXCELLENT' },
        { assetTag: 'LED-P39-CAB-02', condition: 'EXCELLENT' },
      ],
    },
    {
      name: 'Sony FX3 Cinema Camera',
      category: 'Camera',
      description: 'Full-frame 4K Cinema Line Camera with audio handle',
      pricingModel: 'PER_UNIT',
      baseRate: 3500.0,
      setupCharge: 500.0,
      equipment: [
        { assetTag: 'CAM-FX3-01', condition: 'EXCELLENT' },
        { assetTag: 'CAM-FX3-02', condition: 'GOOD' },
      ],
    },
    {
      name: 'Line Array Sound System',
      category: 'Audio',
      description: 'Professional high-power concert line array speakers & subwoofers',
      pricingModel: 'FIXED',
      baseRate: 8000.0,
      setupCharge: 1500.0,
      equipment: [
        { assetTag: 'SND-LA-SYS-01', condition: 'EXCELLENT' },
      ],
    },
    {
      name: 'Live Streaming Unit',
      category: 'Broadcast',
      description: 'Multi-camera switcher, encoder, and high-speed bonded cellular router',
      pricingModel: 'FIXED',
      baseRate: 5000.0,
      setupCharge: 1000.0,
      equipment: [
        { assetTag: 'STRM-BOX-01', condition: 'EXCELLENT' },
      ],
    },
    {
      name: 'Stage Lighting Package',
      category: 'Lighting',
      description: 'DMX controlled moving heads, LED pars, and haze machine',
      pricingModel: 'FIXED',
      baseRate: 6000.0,
      setupCharge: 1500.0,
      equipment: [
        { assetTag: 'LTG-PKG-01', condition: 'GOOD' },
      ],
    },
  ];

  for (const item of catalogItems) {
    const { equipment, ...serviceData } = item;

    // Find or create service in ServiceCatalog
    const existingService = await prisma.serviceCatalog.findFirst({
      where: { name: serviceData.name },
    });

    let service;
    if (existingService) {
      service = await prisma.serviceCatalog.update({
        where: { id: existingService.id },
        data: serviceData,
      });
    } else {
      service = await prisma.serviceCatalog.create({
        data: serviceData,
      });
    }

    // Idempotently upsert EquipmentUnit items matching assetTag
    if (equipment && Array.isArray(equipment)) {
      for (const eqItem of equipment) {
        await prisma.equipmentUnit.upsert({
          where: { assetTag: eqItem.assetTag },
          update: {
            condition: eqItem.condition,
            serviceId: service.id,
          },
          create: {
            assetTag: eqItem.assetTag,
            condition: eqItem.condition,
            serviceId: service.id,
          },
        });
      }
    }

    console.log(`✅ Catalog item seeded: ${service.name} (${service.pricingModel})`);
  }

  console.log('🎉 Bhakti Studio Database Seeding Completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
