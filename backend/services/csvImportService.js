// backend/services/csvImportService.js
// CSV-04: Import job queue + Firestore batch processing
// CSV-06: Batch sentiment tagging (rule-based, reuses existing sentimentAnalysis)

import { db } from '../firebaseAdmin.js';
import { analyzeSentiment } from './sentimentAnalysis.js';

const BATCH_SIZE = 50;

// ─────────────────────────────────────────────
// CSV-04: Queue an import job — returns jobId immediately,
// processes in background
// ─────────────────────────────────────────────
export async function queueCsvImport(userId, packageName, reviews) {
  const jobId = `import_${userId}_${Date.now()}`;

  await db.collection('importJobs').doc(jobId).set({
    userId,
    packageName,
    status: 'processing',
    totalReviews: reviews.length,
    processedReviews: 0,
    importedReviews: 0,
    skippedReviews: 0,
    startedAt: new Date(),
    completedAt: null,
    error: null
  });

  // Process in background — don't await
  processCsvImport(jobId, userId, packageName, reviews)
    .catch(err => {
      console.error(`[CSV Import] Job ${jobId} failed:`, err.message);
      return db.collection('importJobs').doc(jobId).update({
        status: 'failed',
        error: err.message
      });
    });

  return jobId;
}

// ─────────────────────────────────────────────
// CSV-04: Process import in batches of 50
// Existing API-synced reviews: merge missing fields only, never overwrite
// ─────────────────────────────────────────────
async function processCsvImport(jobId, userId, packageName, reviews) {
  let imported = 0;
  let skipped = 0;

  console.log(`[CSV Import] Starting job ${jobId} — ${reviews.length} reviews`);

  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    const batch = reviews.slice(i, i + BATCH_SIZE);
    const firestoreBatch = db.batch();

    for (const review of batch) {
      const docId = `${userId}_${packageName}_${review.reviewId}`;
      const docRef = db.collection('playReviews').doc(docId);
      const existing = await docRef.get();

      if (existing.exists) {
        // Merge only missing fields — don't overwrite live API data
        const existingData = existing.data();
        const fieldsToBackfill = {};

        if (!existingData.appVersion && review.appVersion) {
          fieldsToBackfill.appVersion = review.appVersion;
        }
        if (!existingData.device && review.device) {
          fieldsToBackfill.device = review.device;
        }
        if (!existingData.originalCreatedAt && review.originalCreatedAt) {
          fieldsToBackfill.originalCreatedAt = review.originalCreatedAt;
        }

        if (Object.keys(fieldsToBackfill).length > 0) {
          firestoreBatch.update(docRef, fieldsToBackfill);
        }
        skipped++;

      } else {
        firestoreBatch.set(docRef, {
          reviewId: review.reviewId,
          platform: 'google_play',
          packageName,
          userId,
          authorName: 'Anonymous', // CSV doesn't include reviewer name
          text: review.text,
          starRating: review.starRating,
          reviewTitle: review.reviewTitle,
          reviewerLanguage: review.reviewerLanguage,
          device: review.device,
          appVersion: review.appVersion,
          appVersionCode: review.appVersionCode,
          originalCreatedAt: review.originalCreatedAt,
          lastModified: review.lastModified || review.originalCreatedAt || new Date(),
          hasReply: !!review.replyText,
          replyText: review.replyText,
          replyPostedAt: review.replyPostedAt,
          reviewUrl: review.reviewUrl,
          sentiment: null,
          fetchedAt: new Date(),
          importedFromCsv: true,
          status: review.replyText ? 'replied' : 'pending'
        });
        imported++;
      }
    }

    await firestoreBatch.commit();

    // Update progress
    await db.collection('importJobs').doc(jobId).update({
      processedReviews: Math.min(i + batch.length, reviews.length),
      importedReviews: imported,
      skippedReviews: skipped
    });

    // Avoid Firestore rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[CSV Import] Job ${jobId} — imported: ${imported}, skipped: ${skipped}. Running post-processing...`);

  // Post-import processing
  try {
    await triggerBatchSentimentTagging(userId, packageName);
  } catch (err) {
    console.error(`[CSV Import] Sentiment tagging failed for job ${jobId}:`, err.message);
  }

  try {
    await recalculatePlayAnalytics(userId, packageName);
  } catch (err) {
    console.error(`[CSV Import] Analytics recalc failed for job ${jobId}:`, err.message);
  }

  await db.collection('importJobs').doc(jobId).update({
    status: 'completed',
    importedReviews: imported,
    skippedReviews: skipped,
    completedAt: new Date()
  });

  console.log(`[CSV Import] Job ${jobId} completed`);
}

// ─────────────────────────────────────────────
// CSV-06: Batch sentiment tagging
// Uses existing rule-based analyzeSentiment (fast, free, no API calls)
// Processes up to 500 untagged reviews per run
// ─────────────────────────────────────────────
export async function triggerBatchSentimentTagging(userId, packageName) {
  console.log(`[CSV Import] Tagging sentiment for ${packageName} (user: ${userId})`);

  const snapshot = await db.collection('playReviews')
    .where('userId', '==', userId)
    .where('packageName', '==', packageName)
    .where('sentiment', '==', null)
    .limit(500)
    .get();

  let tagged = 0;

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();

      // Skip empty review text — nothing to analyze
      if (!data.text || data.text.trim() === '') {
        await doc.ref.update({ sentiment: 'neutral', sentimentTaggedAt: new Date() });
        continue;
      }

      const result = analyzeSentiment(data.text, data.starRating);

      await doc.ref.update({
        sentiment: result.label,
        sentimentIndicators: result.indicators,
        hasMixedSentiment: result.isMixed,
        sentimentTaggedAt: new Date()
      });

      tagged++;
    } catch (err) {
      console.error(`[CSV Import] Sentiment tagging failed for ${doc.id}:`, err.message);
      // Continue — don't fail entire batch
    }
  }

  console.log(`[CSV Import] Tagged sentiment for ${tagged} reviews`);
  return tagged;
}

// ─────────────────────────────────────────────
// Recalculate analytics cache after import
// Deletes cached analytics so next dashboard load recalculates
// ─────────────────────────────────────────────
export async function recalculatePlayAnalytics(userId, packageName) {
  console.log(`[CSV Import] Invalidating analytics cache for ${packageName} (user: ${userId})`);

  try {
    await db.collection('users')
      .doc(userId)
      .collection('analytics')
      .doc('summary')
      .delete();
  } catch (err) {
    // Doc may not exist — that's fine
    console.log(`[CSV Import] No existing analytics cache to clear`);
  }
}
