/**
 * Security Middleware Stack
 * Security headers, rate limiting, and input sanitization
 */

// Memory rate limit tracker
const requestCounts = new Map();
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Custom Rate Limiting Middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests allowed per window
 */
export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests. Please try again later.' }) => {
  return (req, res, next) => {
    // LOOP 26: DEVELOPMENT MODE RATE LIMIT BYPASS
    if (isDev) {
      return next();
    }

    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const key = `${req.baseUrl}_${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requestCounts.set(key, record);

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterMs: record.resetTime - now,
      });
    }

    next();
  };
};

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 300,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 200 : 50,
  message: 'Too many authentication attempts. Please wait a few minutes before trying again.',
});

/**
 * XSS & Malicious Input Sanitization Middleware
 */
export const sanitizeInputs = (req, res, next) => {
  const sanitizeValue = (val) => {
    if (typeof val === 'string') {
      // Remove dangerous script tags, html injections, and SQL injection tokens
      return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/onload=/gi, '')
        .replace(/onerror=/gi, '')
        .trim();
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.keys(val).forEach((k) => {
        val[k] = sanitizeValue(val[k]);
      });
    }
    return val;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
};

/**
 * Security HTTP Headers Middleware
 */
export const applySecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: https:;");
  next();
};
