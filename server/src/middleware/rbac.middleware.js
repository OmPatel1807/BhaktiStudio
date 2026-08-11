/**
 * Middleware: Server-side RBAC Guard
 * @param {...string} allowedRoles Allowed user roles ('ADMIN', 'CUSTOMER', 'WORKER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Missing user identity role claim.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Role '${req.user.role}' is not authorized for this operation.`,
      });
    }

    next();
  };
};
