import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllServices = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const where = isAdmin ? {} : { isActive: true };

    const services = await prisma.serviceCatalog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    return res.json({ success: true, data: services });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, category, description, pricingModel, baseRate, setupCharge } = req.body;

    if (!name || !category || !pricingModel || baseRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, pricing model, and base rate are required.',
      });
    }

    if (Number(baseRate) < 0 || (setupCharge !== undefined && Number(setupCharge) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Base rate and setup charge cannot be negative.',
      });
    }

    const service = await prisma.serviceCatalog.create({
      data: {
        name,
        category,
        description,
        pricingModel,
        baseRate: Number(baseRate),
        setupCharge: Number(setupCharge || 0),
      },
    });

    return res.status(201).json({ success: true, data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, pricingModel, baseRate, setupCharge, isActive } = req.body;

    const existing = await prisma.serviceCatalog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (baseRate !== undefined && Number(baseRate) < 0) {
      return res.status(400).json({ success: false, message: 'Base rate cannot be negative.' });
    }

    const updated = await prisma.serviceCatalog.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(pricingModel && { pricingModel }),
        ...(baseRate !== undefined && { baseRate: Number(baseRate) }),
        ...(setupCharge !== undefined && { setupCharge: Number(setupCharge) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete by marking isActive = false
    const service = await prisma.serviceCatalog.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ success: true, message: 'Service deactivated successfully.', data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
