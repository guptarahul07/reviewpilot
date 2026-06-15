// backend/middleware/checkProductAccess.js
// Feature flag middleware — gates routes by product (gbp, play, insights)
// Used as: app.use('/api/play', checkProductAccess('play'))

import { db } from '../firebaseAdmin.js';
import { isAdmin } from './checkSubscription.js';
import { getPlanLimits } from '../config/plans.js';

// Which products each plan key gives access to
const PRODUCT_ACCESS = {
  gbp_starter:    ['gbp'],
  gbp_growth:     ['gbp'],
  gbp_pro:        ['gbp'],
  play_starter:   ['play'],
  play_growth:    ['play'],
  play_pro:       ['play'],
  bundle_starter: ['gbp', 'play'],
  bundle_growth:  ['gbp', 'play', 'insights'],
  bundle_suite:   ['gbp', 'play', 'insights'],
  trial:          ['gbp', 'play'],  // trial gets both during trial period
  admin:          ['gbp', 'play', 'insights']
};

export function checkProductAccess(product) {
  return async (req, res, next) => {
    const uid = req.uid;
    const email = req.email;

    // Admin bypass
    if (isAdmin(email)) return next();

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const subscription = userDoc.data()?.subscription;

      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'PRODUCT_NOT_IN_PLAN',
          message: 'Start your free trial to access this feature',
          upgradeUrl: '/pricing'
        });
      }

      const planKey = subscription.plan || 'trial';
      const allowedProducts = PRODUCT_ACCESS[planKey] || [];

      if (!allowedProducts.includes(product)) {
        return res.status(403).json({
          success: false,
          error: 'PRODUCT_NOT_IN_PLAN',
          message: `Upgrade your plan to access this feature`,
          upgradeUrl: '/pricing',
          currentPlan: planKey,
          requiredProduct: product
        });
      }

      // Attach product limits to request for use in routes
      req.planLimits = getPlanLimits(planKey);
      req.planKey = planKey;

      next();

    } catch (err) {
      console.error('[checkProductAccess] Error:', err.message);
      res.status(500).json({ success: false, error: 'Access check failed' });
    }
  };
}
