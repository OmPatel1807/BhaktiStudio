import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllEquipment = async (req, res) => {
  try {
    const { serviceId, status } = req.query;

    const where = {
      ...(serviceId && { serviceId }),
      ...(status && { status }),
    };

    const equipment = await prisma.equipmentUnit.findMany({
      where,
      include: {
        service: {
          select: { name: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: equipment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createEquipmentUnit = async (req, res) => {
  try {
    const { assetTag, serviceId, condition = 'GOOD', status = 'AVAILABLE' } = req.body;

    if (!assetTag || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Asset tag and linked service ID are required.',
      });
    }

    const existingTag = await prisma.equipmentUnit.findUnique({
      where: { assetTag },
    });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: `Equipment with asset tag '${assetTag}' already exists.`,
      });
    }

    const unit = await prisma.equipmentUnit.create({
      data: {
        assetTag,
        serviceId,
        condition,
        status,
      },
      include: {
        service: { select: { name: true } },
      },
    });

    return res.status(201).json({ success: true, data: unit });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, condition } = req.body;

    const existing = await prisma.equipmentUnit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Equipment unit not found.' });
    }

    const updated = await prisma.equipmentUnit.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(condition && { condition }),
        lastChecked: new Date(),
      },
      include: {
        service: { select: { name: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
