// backend/services/playStoreReviews.js
// Fetch reviews and post replies via Google Play Developer API
// Uses direct HTTP — googleapis client doesn't wrap androidpublisher reviews cleanly

import { db } from '../firebaseAdmin.js';
import { getValidPlayToken } from './playStoreOAuth.js';

const PLAY_API_BASE = 'https://www.googleapis.com/androidpublisher/v3/applications';

// ─────────────────────────────────────────────
// Fetch all reviews for a package — handles pagination
// ─────────────────────────────────────────────
async function fetchAllReviews(packageName, accessToken) {
  let allReviews = [];
  let pageToken = null;

  do {
    const url = `${PLAY_API_BASE}/${packageName}/reviews?maxResults=100${pageToken ? `&token=${pageToken}` : ''}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    allReviews = [...allReviews, ...(data.reviews || [])];
    pageToken = data.tokenPagination?.nextPageToken || null;

  } while (pageToken);

  return allReviews;
}

// ─────────────────────────────────────────────
// Parse raw Play API review into our format
// ─────────────────────────────────────────────
function parsePlayReview(rawReview, packageName, uid) {
  const userComment = rawReview.comments?.[0]?.userComment || {};
  const developerComment = rawReview.comments?.find(c => c.developerComment)?.developerComment;

  return {
    reviewId: rawReview.reviewId,
    platform: 'google_play',
    packageName,
    userId: uid,
    authorName: rawReview.authorName || 'Anonymous',
    text: userComment.text || '',
    starRating: userComment.starRating || 0,
    reviewerLanguage: userComment.reviewerLanguage || 'en',
    device: userComment.deviceMetadata?.productName || userComment.device || null,
    appVersion: userComment.appVersionName || null,
    thumbsUpCount: userComment.thumbsUpCount || 0,
    lastModified: userComment.lastModified?.seconds
      ? new Date(parseInt(userComment.lastModified.seconds) * 1000)
      : new Date(),
    hasReply: !!developerComment,
    replyText: developerComment?.text || null,
    replyPostedAt: developerComment?.lastModified?.seconds
      ? new Date(parseInt(developerComment.lastModified.seconds) * 1000)
      : null,
    sentiment: null,
    fetchedAt: new Date(),
    status: developerComment ? 'replied' : 'pending'
  };
}

// ─────────────────────────────────────────────
// Fetch and store reviews for one app
// ─────────────────────────────────────────────
export async function fetchAndStorePlayReviews(uid, packageName) {
  console.log(`[Play] Fetching reviews for ${packageName} (user: ${uid})`);

  const accessToken = await getValidPlayToken(uid);
  const rawReviews = await fetchAllReviews(packageName, accessToken);

  console.log(`[Play] Fetched ${rawReviews.length} reviews for ${packageName}`);

  let savedCount = 0;

  for (const raw of rawReviews) {
    const review = parsePlayReview(raw, packageName, uid);
    const docId = `${uid}_${packageName}_${review.reviewId}`;

    await db.collection('playReviews').doc(docId).set(review, { merge: true });
    savedCount++;
  }

  // Update lastSyncAt on the app doc
  await db
    .collection('users')
    .doc(uid)
    .collection('playApps')
    .doc(packageName)
    .set({ lastSyncAt: new Date() }, { merge: true });

  console.log(`[Play] Saved ${savedCount} reviews for ${packageName}`);
  return savedCount;
}

// ─────────────────────────────────────────────
// Post reply to a Play Store review
// ─────────────────────────────────────────────
export async function postPlayReply(uid, packageName, reviewId, replyText) {
  if (!replyText || replyText.trim().length === 0) {
    throw new Error('Reply text cannot be empty');
  }

  if (replyText.length > 350) {
    throw new Error('Reply exceeds 350 character limit');
  }

  console.log(`[Play] Posting reply to review ${reviewId} for ${packageName}`);

  const accessToken = await getValidPlayToken(uid);

  const url = `${PLAY_API_BASE}/${packageName}/reviews/${reviewId}:reply`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ replyText: replyText.trim() })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  const result = await res.json();

  // Update Firestore review status
  const docId = `${uid}_${packageName}_${reviewId}`;
  await db.collection('playReviews').doc(docId).set({
    hasReply: true,
    replyText: replyText.trim(),
    replyPostedAt: new Date(),
    status: 'replied'
  }, { merge: true });

  console.log(`[Play] ✅ Reply posted for review ${reviewId}`);
  return result;
}

// ─────────────────────────────────────────────
// Validate that a package name belongs to this user
// Checks if it exists in user's playApps collection
// ─────────────────────────────────────────────
export async function validatePackageOwnership(uid, packageName) {
  const appDoc = await db
    .collection('users')
    .doc(uid)
    .collection('playApps')
    .doc(packageName)
    .get();

  return appDoc.exists;
}
