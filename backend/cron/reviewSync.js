import cron from 'node-cron';
import { db } from '../firebaseAdmin.js';
import { fetchGoogleReviews, generateMockReviews } from '../services/googleReviews.js';
import { getUserSettings, shouldSkipReview } from '../services/replyModeHandler.js';
import { analyzeSentiment } from '../services/sentimentAnalysis.js';
import { trackEvent } from '../utils/analytics.js';
import { refreshBusinessProfileIfNeeded } from '../services/businessProfileService.js';
import { fetchAndStorePlayReviews } from '../services/playStoreReviews.js';

async function syncReviewsForUser(uid) {
  console.log(`[CRON] Syncing reviews for user: ${uid}`);

  let reviews = [];
  try {
    reviews = await fetchGoogleReviews(uid);
    console.log(`[CRON] Fetched ${reviews.length} reviews from Google for user: ${uid}`);
  } catch (err) {
    console.warn(`[CRON] Google API failed for user ${uid}, using mock:`, err.message);
    reviews = generateMockReviews();
  }

  const settings = await getUserSettings(uid);
  let synced = 0;

  for (const review of reviews) {
    try {
      if (shouldSkipReview(review, settings)) {
        console.log(`[CRON] Skipping rating-only review: ${review.id}`);
        continue;
      }

      // Skip if already exists
      const existingDoc = await db
        .collection('users')
        .doc(uid)
        .collection('reviews')
        .doc(review.id)
        .get();

      if (existingDoc.exists) {
        console.log(`[CRON] Review ${review.id} already exists, skipping`);
        continue;
      }

      const sentimentAnalysis = analyzeSentiment(review.text, review.rating);

      await db
        .collection('users')
        .doc(uid)
        .collection('reviews')
        .doc(review.id)
        .set({
          ...review,
          sentiment: sentimentAnalysis.label,
          sentimentAnalysis: sentimentAnalysis.indicators,
          hasMixedSentiment: sentimentAnalysis.isMixed,
          createdAt: new Date(),
          syncedAt: new Date()
        }, { merge: true });

      synced++;

    } catch (err) {
      console.error(`[CRON] Failed to process review ${review.id}:`, err.message);
    }
  }

  await db.collection('users').doc(uid).set({ lastSyncAt: new Date() }, { merge: true });

  // Section 13.5 — Refresh business profile weekly
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const locationId = userDoc.data()?.googleLocationId;
    if (locationId && locationId !== 'pending-verification') {
      await refreshBusinessProfileIfNeeded(uid, locationId);
    }
  } catch (profileErr) {
    console.warn(`[CRON] Business profile refresh failed for ${uid}:`, profileErr.message);
  }
  await trackEvent(uid, 'reviews_synced', { count: synced, source: 'cron' });

  console.log(`[CRON] Synced ${synced} new reviews for user: ${uid}`);
  return synced;
}

export async function runDailySync() {
  console.log('[CRON] Starting daily review sync...');

  try {
    const usersSnapshot = await db
      .collection('users')
      .where('google.connected', '==', true)
      .get();

    console.log(`[CRON] Found ${usersSnapshot.size} connected users`);

    let successCount = 0;
    let failCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        await syncReviewsForUser(uid);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`[CRON] Sync failed for user ${uid}:`, err.message);
        failCount++;
      }
    }

    console.log(`[CRON] Daily sync complete — ${successCount} success, ${failCount} failed`);

  // Play Store sync
  await syncPlayStoreReviews();

  } catch (err) {
    console.error('[CRON] Daily sync error:', err);
  }
}

// Sync Play Store reviews for all connected users
async function syncPlayStoreReviews() {
  console.log('[CRON] Starting Play Store review sync...');

  try {
    const usersSnapshot = await db
      .collection('users')
      .where('playAuth.connected', '==', true)
      .get();

    console.log(`[CRON] Found ${usersSnapshot.size} Play Console connected users`);

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        const appsSnapshot = await db
          .collection('users')
          .doc(uid)
          .collection('playApps')
          .get();

        for (const appDoc of appsSnapshot.docs) {
          const packageName = appDoc.data().packageName;
          try {
            await fetchAndStorePlayReviews(uid, packageName);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between apps
          } catch (err) {
            console.error(`[CRON] Play sync failed for ${packageName} (${uid}):`, err.message);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between users
      } catch (err) {
        console.error(`[CRON] Play sync failed for user ${uid}:`, err.message);
      }
    }

    console.log('[CRON] Play Store sync complete');
  } catch (err) {
    console.error('[CRON] Play Store sync error:', err.message);
  }
}

// 2 AM IST = 20:30 UTC
cron.schedule('30 20 * * *', runDailySync, { timezone: 'UTC' });

console.log('[CRON] Daily review sync scheduled — runs at 2:00 AM IST');