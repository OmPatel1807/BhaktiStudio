import jwt from 'jsonwebtoken';

/**
 * Middleware: Verify Bearer JWT Token & attach decoded payload to req.user
 */
export const authenticateToken = (req, res, next) => {
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
