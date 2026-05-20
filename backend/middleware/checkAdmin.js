import { isAdmin } from './checkSubscription.js';

// Middleware to restrict routes to admin only
export function checkAdmin(req, res, next) {
  const email = req.email;

  if (!email || !isAdmin(email)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }

  req.isAdmin = true;
  next();
}
