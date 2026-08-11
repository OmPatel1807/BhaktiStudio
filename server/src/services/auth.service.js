import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  /**
   * Verify Google OAuth ID Token
   * @param {string} idToken 
   * @returns {Promise<{ email: string, name: string, picture: string }>}
   */
  static async verifyGoogleToken(idToken) {
    // If running in development with mock token
    if (process.env.NODE_ENV === 'development' && idToken.startsWith('mock_token_')) {
      const parts = idToken.split('_');
      const email = parts[2] || 'test@bhaktistudio.com';
      const name = parts[3] || 'Test User';
      return { email, name, picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      };
    } catch (error) {
      throw new Error(`Google token verification failed: ${error.message}`);
    }
  }

  /**
   * Authenticate user with Google payload and requested role intent
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.name
   * @param {string} [params.picture]
   * @param {'CUSTOMER' | 'WORKER' | 'ADMIN'} params.requestedRole
   */
  static async authenticateUserWithGoogle({ email, name, picture, requestedRole }) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (requestedRole === 'ADMIN') {
      if (!user || user.role !== 'ADMIN') {
        const error = new Error('Admin access denied. Account is not authorized as Admin.');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestedRole === 'WORKER') {
      if (!user || user.role !== 'WORKER') {
        const error = new Error('Account not authorized as Worker. Contact Admin.');
        error.statusCode = 403;
        throw error;
      }
    } else {
      // CUSTOMER flow: Auto-create as CUSTOMER if not registered
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name,
            avatarUrl: picture,
            role: 'CUSTOMER',
            customerProfile: {
              create: {},
            },
          },
        });
      }
    }

    // Update avatar/name if changed
    if (user && (user.name !== name || user.avatarUrl !== picture)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, avatarUrl: picture },
      });
    }

    const token = this.generateJwtToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Sign JWT Token containing { userId, email, role }
   */
  static generateJwtToken(user) {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_bhakti_studio_2026_change_in_production';
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
}
