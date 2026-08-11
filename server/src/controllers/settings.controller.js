import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE_PATH = path.resolve(__dirname, '../../../config/settings.json');

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.businessSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          baseLedSqFtRate: 150.0,
          defaultSetupFee: 2000.0,
          defaultTransportRate: 50.0,
          taxPercentage: 18.0,
          advancePayPercentage: 30.0,
        },
      });
    }

    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      baseLedSqFtRate,
      defaultSetupFee,
      defaultTransportRate,
      taxPercentage,
      advancePayPercentage,
    } = req.body;

    if (
      Number(baseLedSqFtRate) < 0 ||
      Number(defaultSetupFee) < 0 ||
      Number(defaultTransportRate) < 0 ||
      Number(taxPercentage) < 0 ||
      Number(advancePayPercentage) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Pricing rates, taxes, and percentages cannot be negative.',
      });
    }

    let existing = await prisma.businessSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let updated;
    if (existing) {
      updated = await prisma.businessSettings.update({
        where: { id: existing.id },
        data: {
          baseLedSqFtRate: Number(baseLedSqFtRate),
          defaultSetupFee: Number(defaultSetupFee),
          defaultTransportRate: Number(defaultTransportRate),
          taxPercentage: Number(taxPercentage),
          advancePayPercentage: Number(advancePayPercentage),
        },
      });
    } else {
      updated = await prisma.businessSettings.create({
        data: {
          baseLedSqFtRate: Number(baseLedSqFtRate),
          defaultSetupFee: Number(defaultSetupFee),
          defaultTransportRate: Number(defaultTransportRate),
          taxPercentage: Number(taxPercentage),
          advancePayPercentage: Number(advancePayPercentage),
        },
      });
    }

    // Sync changes to central config/settings.json file
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
        const json = JSON.parse(raw);
        json.pricingRules.baseLedSqFtRate = updated.baseLedSqFtRate;
        json.pricingRules.defaultSetupFee = updated.defaultSetupFee;
        json.pricingRules.defaultTransportRate = updated.defaultTransportRate;
        json.pricingRules.taxPercentage = updated.taxPercentage;
        json.pricingRules.advancePayPercentage = updated.advancePayPercentage;
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(json, null, 2));
      }
    } catch (fsErr) {
      console.error('Warning: Failed to sync settings.json file:', fsErr.message);
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
