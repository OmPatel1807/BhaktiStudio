import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bhakti Studio Database Seed...');

  // 1. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bhaktistudio.com' },
    update: {},
    create: {
      email: 'admin@bhaktistudio.com',
      name: 'System Admin',
      phone: '+91 99999 00000',
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
    const user = await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
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
  }

  // 3. Seed Service Catalog Items
  const catalogItems = [
    {
      name: 'LED Wall P3.9',
      category: 'Display',
      description: 'High definition outdoor/indoor P3.9 LED video wall',
      pricingModel: 'AREA_BASED',
      baseRate: 150.0,
      setupCharge: 2000.0,
      equipment: {
        create: [
          { assetTag: 'LED-P39-CAB-01', condition: 'EXCELLENT' },
          { assetTag: 'LED-P39-CAB-02', condition: 'EXCELLENT' },
        ],
      },
    },
    {
      name: 'Sony FX3 Cinema Camera',
      category: 'Camera',
      description: 'Full-frame 4K Cinema Line Camera with audio handle',
      pricingModel: 'PER_UNIT',
      baseRate: 3500.0,
      setupCharge: 500.0,
      equipment: {
        create: [
          { assetTag: 'CAM-FX3-01', condition: 'EXCELLENT' },
          { assetTag: 'CAM-FX3-02', condition: 'GOOD' },
        ],
      },
    },
    {
      name: 'Line Array Sound System',
      category: 'Audio',
      description: 'Professional high-power concert line array speakers & subwoofers',
      pricingModel: 'FIXED',
      baseRate: 8000.0,
      setupCharge: 1500.0,
      equipment: {
        create: [{ assetTag: 'SND-LA-SYS-01', condition: 'EXCELLENT' }],
      },
    },
    {
      name: 'Live Streaming Unit',
      category: 'Broadcast',
      description: 'Multi-camera switcher, encoder, and high-speed bonded cellular router',
      pricingModel: 'FIXED',
      baseRate: 5000.0,
      setupCharge: 1000.0,
      equipment: {
        create: [{ assetTag: 'STRM-BOX-01', condition: 'EXCELLENT' }],
      },
    },
    {
      name: 'Stage Lighting Package',
      category: 'Lighting',
      description: 'DMX controlled moving heads, LED pars, and haze machine',
      pricingModel: 'FIXED',
      baseRate: 6000.0,
      setupCharge: 1500.0,
      equipment: {
        create: [{ assetTag: 'LTG-PKG-01', condition: 'GOOD' }],
      },
    },
  ];

  for (const item of catalogItems) {
    const created = await prisma.serviceCatalog.create({
      data: item,
    });
    console.log(`✅ Catalog item seeded: ${created.name} (${created.pricingModel})`);
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
