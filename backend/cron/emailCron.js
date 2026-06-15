// backend/cron/emailCron.js
// Scheduled email jobs — runs daily at 9AM IST
// Handles: trial emails (T4, T5, T6), data deletion warning
// Payment emails (T7, T8) are handled by Razorpay webhooks in billing.js

import cron from 'node-cron';
import { db } from '../firebaseAdmin.js';
import {
  sendTrialHalfOverEmail,
  sendTrialEndingSoonEmail,
  sendTrialExpiredEmail,
  sendDataDeletionWarningEmail
} from '../services/emailService.js';

// ─────────────────────────────────────────────
// Helper — get user's display name
// ─────────────────────────────────────────────
function getUserName(userData) {
  return userData.profile?.displayName || userData.displayName || 'there';
}

// ─────────────────────────────────────────────
// Helper — get days between two dates
// ─────────────────────────────────────────────
function daysBetween(date1, date2) {
  return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────
// Helper — get user usage stats for T4 email
// ─────────────────────────────────────────────
async function getUserStats(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const usage = userDoc.data()?.usage || {};

    const reviewsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('reviews')
      .get();

    const reviews = reviewsSnapshot.docs.map(d => d.data());
    const total = reviews.length;
    const replied = reviews.filter(r =>
      ['posted', 'posted_auto', 'posted_manual', 'posted_bulk'].includes(r.status)
    ).length;

    return {
      reviewsSynced: total,
      repliesGenerated: usage.reviewsGenerated || 0,
      responseRate: total > 0 ? Math.round((replied / total) * 100) : 0
    };
  } catch {
    return { reviewsSynced: 0, repliesGenerated: 0, responseRate: 0 };
  }
}

// ─────────────────────────────────────────────
// Main email job — runs daily
// ─────────────────────────────────────────────
async function runDailyEmailJobs() {
  console.log('[Email Cron] Starting daily email jobs...');

  try {
    const usersSnapshot = await db.collection('users').get();
    const now = new Date();

    let t4Count = 0, t5Count = 0, t6Count = 0, deletionCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const email = userData.email;
      const subscription = userData.subscription;

      if (!email) continue;

      // Skip admin users
      if (email === 'guptarahul07@gmail.com') continue;

      const name = getUserName(userData);

      // Only process trial users
      if (subscription?.status !== 'trial') {

        // Check for expired users — data deletion warning at Day 30
        if (subscription?.status === 'expired' || subscription?.status === 'cancelled') {
          const expiredAt = subscription.trialEndsAt?.toDate
            ? subscription.trialEndsAt.toDate()
            : subscription.cancelledAt?.toDate
              ? subscription.cancelledAt.toDate()
              : null;

          if (expiredAt) {
            const daysSinceExpiry = daysBetween(expiredAt, now);
            if (daysSinceExpiry === 30) {
              const deletionDate = new Date(expiredAt);
              deletionDate.setDate(deletionDate.getDate() + 37); // 7 day grace after warning

              await sendDataDeletionWarningEmail({
                to: email,
                name,
                deletionDate: deletionDate.toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
              });
              deletionCount++;
            }
          }
        }

        continue; // Skip non-trial users for trial emails
      }

      const trialEndsAt = subscription.trialEndsAt?.toDate
        ? subscription.trialEndsAt.toDate()
        : new Date(subscription.trialEndsAt);

      const trialDays = subscription.trialDays || 15;
      const trialStarted = subscription.createdAt?.toDate
        ? subscription.createdAt.toDate()
        : new Date(subscription.createdAt);

      const daysIntoTrial = daysBetween(trialStarted, now);
      const daysLeft = Math.max(0, daysBetween(now, trialEndsAt));
      const halfwayDay = Math.floor(trialDays / 2);

      // T4 — Trial half over (at halfway point)
      if (daysIntoTrial === halfwayDay && !userData.emailsSent?.t4) {
        const stats = await getUserStats(uid);
        await sendTrialHalfOverEmail({ to: email, name, daysLeft, ...stats });
        await db.collection('users').doc(uid).set({
          emailsSent: { t4: new Date() }
        }, { merge: true });
        t4Count++;
      }

      // T5 — Trial ending tomorrow (1 day before expiry)
      if (daysLeft === 1 && !userData.emailsSent?.t5) {
        await sendTrialEndingSoonEmail({ to: email, name });
        await db.collection('users').doc(uid).set({
          emailsSent: { t5: new Date() }
        }, { merge: true });
        t5Count++;
      }

      // T6 — Trial expired (day of expiry)
      if (daysLeft === 0 && !userData.emailsSent?.t6) {
        await sendTrialExpiredEmail({ to: email, name });
        // Update subscription status to expired
        await db.collection('users').doc(uid).set({
          subscription: { status: 'expired' },
          emailsSent: { t6: new Date() }
        }, { merge: true });
        t6Count++;
      }

      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[Email Cron] Done — T4: ${t4Count}, T5: ${t5Count}, T6: ${t6Count}, Deletion warnings: ${deletionCount}`);

  } catch (err) {
    console.error('[Email Cron] Error:', err.message);
  }
}

// 9AM IST = 3:30 UTC
cron.schedule('30 3 * * *', runDailyEmailJobs, { timezone: 'UTC' });

console.log('[Email Cron] Scheduled — runs daily at 9:00 AM IST');

export { runDailyEmailJobs };
