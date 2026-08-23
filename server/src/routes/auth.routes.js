import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/v1/auth/google
 * Exchanging Google ID Token for Bhakti Studio JWT & user profile
 */
router.post('/google', async (req, res, next) => {
  try {
    const { accessToken, idToken, credential, role, requestedRole = 'CUSTOMER', mode = 'LOGIN' } = req.body;
    const targetRole = role || requestedRole;

    if (!accessToken && !idToken && !credential) {
      return res.status(400).json({
        success: false,
        message: 'Google Access Token or ID Token is required.',
      });
    }

    const googleUser = await AuthService.verifyGoogleToken({
      accessToken,
      idToken: idToken || credential,
    });

    const result = await AuthService.authenticateUserWithGoogle({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      requestedRole: targetRole,
      mode,
    });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user details
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.user.userId);
    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
});

export default router;
