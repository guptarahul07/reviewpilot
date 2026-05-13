import rateLimit from 'express-rate-limit';

// General API limit — all /api routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.uid || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// AI generation limit — expensive operations
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.uid || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. Please wait a minute.',
      retryAfter: 60
    });
  }
});

// Auth limit — OAuth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many auth attempts. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});