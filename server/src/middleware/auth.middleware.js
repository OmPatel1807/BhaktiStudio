import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware: Verify Bearer JWT Token & attach decoded payload to req.user
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_bhakti_studio_2026_change_in_production';
    const decoded = jwt.verify(token, secret);

    if (decoded.role === 'WORKER') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          code: 'WORKER_APPLICATION_PENDING',
          message: 'Your crew application is currently pending admin review. You will be able to log in once Bhakti Studio approves your account.',
        });
      }
    }

    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or token expired.',
      error: error.message,
    });
  }
};
