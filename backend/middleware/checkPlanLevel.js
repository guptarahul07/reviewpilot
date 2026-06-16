// backend/middleware/checkPlanLevel.js
// Restricts a route to specific plan tiers (e.g. Growth, Pro for CSV import)
// Must run AFTER checkProductAccess — relies on req.planKey being set

import { isAdmin } from './checkSubscription.js';

export function checkPlanLevel(allowedPlans) {
  return (req, res, next) => {
    const email = req.email;

    // Admin bypass
    if (isAdmin(email)) return next();

    const planKey = req.planKey;

    if (!allowedPlans.includes(planKey)) {
      return res.status(403).json({
        success: false,
        error: 'PLAN_LEVEL_INSUFFICIENT',
        message: 'Import your full review history — available on Growth plan. Unlock version trends, sentiment analysis, and keyword insights from all your historical reviews.',
        currentPlan: planKey,
        requiredPlans: allowedPlans,
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
}
