// backend/middleware/trialGate.js
// Section 12 — Trial feature gating
// Gates specific features for trial users with reply counter tracking

import { db } from '../firebaseAdmin.js';
import { isAdmin } from './checkSubscription.js';

export const TRIAL_LIMITS = {
  aiRepliesLimit: 10,
  ratingTrendDays: 30,
  maxLocations: 1,
  maxApps: 1,
  keywordAnalysis: false,
  responseRate: false,
  responseSpeed: false,
  aiInsightsCard: false,
  csvImport: false,
  bulkReply: false,
  businessProfileContext: false,
  sentimentFull: false
};

// Plans that get full business profile context in AI replies
export const CONTEXT_PLANS = [
  'growth', 'pro',
  'gbp_growth', 'gbp_pro',
  'play_growth', 'play_pro',
  'bundle_growth', 'bundle_suite',
  'admin'
];

export function checkTrialFeature(feature) {
  return async (req, res, next) => {
    const uid = req.uid;
    const email = req.email;

    // Admin bypass
    if (isAdmin(email)) return next();

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const subscription = userDoc.data()?.subscription;

      // Not on trial — pass through to plan-level checks
      if (!subscription || subscription.status !== 'trial') return next();

      // Feature is a boolean lock
      if (TRIAL_LIMITS[feature] === false) {
        return res.status(403).json({
          success: false,
          error: 'TRIAL_FEATURE_LOCKED',
          feature,
          message: 'This feature is not available during trial. Upgrade to unlock.',
          upgradeUrl: '/pricing'
        });
      }

      // AI reply counter check
      if (feature === 'aiReply') {
        const trialRepliesUsed = subscription.trialRepliesUsed || 0;

        if (trialRepliesUsed >= TRIAL_LIMITS.aiRepliesLimit) {
          return res.status(403).json({
            success: false,
            error: 'TRIAL_REPLY_LIMIT_REACHED',
            feature,
            repliesUsed: trialRepliesUsed,
            repliesLimit: TRIAL_LIMITS.aiRepliesLimit,
            message: `Trial limit: ${TRIAL_LIMITS.aiRepliesLimit} AI replies used. Upgrade to continue.`,
            upgradeUrl: '/pricing'
          });
        }

        // Attach counter to request for post-generation increment
        req.trialRepliesUsed = trialRepliesUsed;
        req.isTrialReply = true;
      }

      next();

    } catch (err) {
      console.error('[trialGate] Error:', err.message);
      // Fail open — don't block users on internal errors
      next();
    }
  };
}

// Call this AFTER successful AI reply generation to increment counter
export async function incrementTrialReplyCount(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const current = userDoc.data()?.subscription?.trialRepliesUsed || 0;

    await db.collection('users').doc(uid).set({
      subscription: { trialRepliesUsed: current + 1 }
    }, { merge: true });

  } catch (err) {
    console.error('[trialGate] incrementTrialReplyCount error:', err.message);
  }
}

// GET trial status — for frontend reply counter display
export async function getTrialStatus(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscription = userDoc.data()?.subscription;

    if (!subscription || subscription.status !== 'trial') {
      return { isTrial: false };
    }

    const trialRepliesUsed = subscription.trialRepliesUsed || 0;
    const trialEndsAt = subscription.trialEndsAt?.toDate
      ? subscription.trialEndsAt.toDate()
      : new Date(subscription.trialEndsAt);

    const daysLeft = Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)));

    return {
      isTrial: true,
      trialRepliesUsed,
      trialRepliesLimit: TRIAL_LIMITS.aiRepliesLimit,
      trialRepliesRemaining: Math.max(0, TRIAL_LIMITS.aiRepliesLimit - trialRepliesUsed),
      trialDaysLeft: daysLeft,
      trialEndsAt
    };
  } catch (err) {
    console.error('[trialGate] getTrialStatus error:', err.message);
    return { isTrial: false };
  }
}
