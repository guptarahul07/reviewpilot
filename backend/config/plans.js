// backend/config/plans.js
// Single source of truth for all plan definitions
// Used by billing.js, planLimits.js, checkSubscription.js

export const PLANS = {

  // ─── GBP Individual ───────────────────────────────
  gbp_starter: {
    name: 'Google Reviews Starter',
    product: 'gbp',
    monthly: { amount: 49900, period: 'monthly' },
    annual:  { amount: 479000, period: 'yearly' },
    limits: {
      gbpLocations: 1,
      playApps: 0,
      insightsEnabled: false,
      reviewsPerMonth: 50,
      repliesPerMonth: 50
    }
  },
  gbp_growth: {
    name: 'Google Reviews Growth',
    product: 'gbp',
    monthly: { amount: 99900, period: 'monthly' },
    annual:  { amount: 899100, period: 'yearly' },
    limits: {
      gbpLocations: 3,
      playApps: 0,
      insightsEnabled: true,
      reviewsPerMonth: 200,
      repliesPerMonth: 200
    }
  },
  gbp_pro: {
    name: 'Google Reviews Pro',
    product: 'gbp',
    monthly: { amount: 199900, period: 'monthly' },
    annual:  { amount: 1679200, period: 'yearly' },
    limits: {
      gbpLocations: 999,
      playApps: 0,
      insightsEnabled: true,
      reviewsPerMonth: Infinity,
      repliesPerMonth: Infinity
    }
  },

  // ─── Play Store Individual ─────────────────────────
  play_starter: {
    name: 'Play Store Starter',
    product: 'play',
    monthly: { amount: 49900, period: 'monthly' },
    annual:  { amount: 479000, period: 'yearly' },
    limits: {
      gbpLocations: 0,
      playApps: 1,
      insightsEnabled: false,
      reviewsPerMonth: 50,
      repliesPerMonth: 50
    }
  },
  play_growth: {
    name: 'Play Store Growth',
    product: 'play',
    monthly: { amount: 99900, period: 'monthly' },
    annual:  { amount: 899100, period: 'yearly' },
    limits: {
      gbpLocations: 0,
      playApps: 3,
      insightsEnabled: true,
      reviewsPerMonth: 200,
      repliesPerMonth: 200
    }
  },
  play_pro: {
    name: 'Play Store Pro',
    product: 'play',
    monthly: { amount: 199900, period: 'monthly' },
    annual:  { amount: 1679200, period: 'yearly' },
    limits: {
      gbpLocations: 0,
      playApps: 999,
      insightsEnabled: true,
      reviewsPerMonth: Infinity,
      repliesPerMonth: Infinity
    }
  },

  // ─── Bundles ───────────────────────────────────────
  bundle_starter: {
    name: 'Starter Bundle',
    product: 'bundle',
    monthly: { amount: 79900, period: 'monthly' },
    annual:  { amount: 767040, period: 'yearly' },
    limits: {
      gbpLocations: 1,
      playApps: 1,
      insightsEnabled: false,
      reviewsPerMonth: 100,
      repliesPerMonth: 100
    }
  },
  bundle_growth: {
    name: 'Growth Bundle',
    product: 'bundle',
    monthly: { amount: 179900, period: 'monthly' },
    annual:  { amount: 1619100, period: 'yearly' },
    limits: {
      gbpLocations: 3,
      playApps: 3,
      insightsEnabled: true,
      reviewsPerMonth: 400,
      repliesPerMonth: 400
    }
  },
  bundle_suite: {
    name: 'Business Suite',
    product: 'bundle',
    monthly: { amount: 349900, period: 'monthly' },
    annual:  { amount: 2939160, period: 'yearly' },
    limits: {
      gbpLocations: 999,
      playApps: 999,
      insightsEnabled: true,
      reviewsPerMonth: Infinity,
      repliesPerMonth: Infinity
    }
  },

  // ─── Internal use only ────────────────────────────
  trial: {
    name: 'Free Trial',
    product: 'trial',
    limits: {
      gbpLocations: 1,
      playApps: 1,
      insightsEnabled: false,
      reviewsPerMonth: 50,
      repliesPerMonth: 50
    }
  },
  admin: {
    name: 'Admin',
    product: 'admin',
    limits: {
      gbpLocations: 999,
      playApps: 999,
      insightsEnabled: true,
      reviewsPerMonth: Infinity,
      repliesPerMonth: Infinity
    }
  }
};

// Helper — get plan limits by plan key
export function getPlanLimits(planKey) {
  return PLANS[planKey]?.limits || PLANS.trial.limits;
}

// Helper — get plan price
export function getPlanPrice(planKey, billingCycle) {
  const plan = PLANS[planKey];
  if (!plan) return null;
  return billingCycle === 'annual' ? plan.annual?.amount : plan.monthly?.amount;
}

// All valid plan keys for validation
export const VALID_PLAN_KEYS = Object.keys(PLANS).filter(k =>
  !['trial', 'admin'].includes(k)
);
