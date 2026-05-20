import { db } from '../firebaseAdmin.js';
import admin from '../firebaseAdmin.js';

export const PLAN_LIMITS = {
  free: {
    locations: 0,
    reviewsPerMonth: 0,
    repliesPerMonth: 0,
    features: []
  },
  starter: {
    locations: 1,
    reviewsPerMonth: 50,
    repliesPerMonth: 50,
    features: ['basic_insights']
  },
  growth: {
    locations: 3,
    reviewsPerMonth: 200,
    repliesPerMonth: 200,
    features: ['basic_insights', 'advanced_insights', 'sentiment']
  },
  professional: {
    locations: 10,
    reviewsPerMonth: Infinity,
    repliesPerMonth: Infinity,
    features: ['basic_insights', 'advanced_insights', 'sentiment', 'custom_reports']
  },
  admin: {
    locations: Infinity,
    reviewsPerMonth: Infinity,
    repliesPerMonth: Infinity,
    features: ['all']
  }
};

// Get current month string e.g. "2026-05"
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Check if user is within plan limits for a given action
export async function checkLimit(uid, action) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const data = userDoc.data() || {};
    const plan = data.subscription?.plan || 'free';
    const usage = data.usage || {};
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Reset usage if new month
    const currentMonth = getCurrentMonth();
    if (usage.currentMonth && usage.currentMonth !== currentMonth) {
      console.log(`[planLimits] New month detected for user ${uid} — resetting usage`);
      await resetUsage(uid);
      return { allowed: true }; // Fresh month, allow
    }

    if (action === 'add_location') {
      const locationsConnected = usage.locationsConnected || 0;
      if (locationsConnected >= limits.locations) {
        return {
          allowed: false,
          message: `Your ${plan} plan supports up to ${limits.locations} location(s). Upgrade to add more.`,
          requiresUpgrade: true
        };
      }
    }

    if (action === 'generate_reply') {
      const reviewsGenerated = usage.reviewsGenerated || 0;
      if (reviewsGenerated >= limits.reviewsPerMonth) {
        return {
          allowed: false,
          message: `You've reached your monthly limit of ${limits.reviewsPerMonth} AI replies. Upgrade for more.`,
          requiresUpgrade: true
        };
      }
    }

    if (action === 'post_reply') {
      const repliesPosted = usage.repliesPosted || 0;
      if (repliesPosted >= limits.repliesPerMonth) {
        return {
          allowed: false,
          message: `You've reached your monthly posting limit of ${limits.repliesPerMonth}. Upgrade for more.`,
          requiresUpgrade: true
        };
      }
    }

    return { allowed: true };

  } catch (err) {
    console.error('[planLimits] checkLimit error:', err.message);
    return { allowed: true }; // Fail open — don't block users on internal errors
  }
}

// Increment a usage counter for current month
export async function incrementUsage(uid, counter) {
  try {
    const currentMonth = getCurrentMonth();

    await db.collection('users').doc(uid).set({
      usage: {
        currentMonth,
        [counter]: admin.firestore.FieldValue.increment(1)
      }
    }, { merge: true });

  } catch (err) {
    console.error(`[planLimits] incrementUsage error for ${counter}:`, err.message);
  }
}

// Reset usage counters — called on new month
export async function resetUsage(uid) {
  try {
    await db.collection('users').doc(uid).set({
      usage: {
        currentMonth: getCurrentMonth(),
        reviewsGenerated: 0,
        repliesPosted: 0,
        locationsConnected: 0
      }
    }, { merge: true });
  } catch (err) {
    console.error(`[planLimits] resetUsage error for ${uid}:`, err.message);
  }
}
