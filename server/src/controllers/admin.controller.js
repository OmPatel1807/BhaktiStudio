import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const promoteUserToAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Target email is required.' });
    }

    const targetEmail = email.toLowerCase().trim();
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `No account found with email ${targetEmail}. Please ask them to register first.`
      });
    }

    // Update user role to ADMIN and clear any blocking worker status
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: 'ADMIN',
        status: 'APPROVED',
        isActive: true,
      }
    });

    return res.json({
      success: true,
      message: `User ${targetEmail} is now an ADMIN! They can log in immediately.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      }
    });
  } catch (error) {
    console.error('Promote Admin Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to promote user.' });
  }
};
