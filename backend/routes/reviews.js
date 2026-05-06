import express from 'express';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { postReplyToGoogle } from '../services/googleReviews.js';
import { getUserSettings } from '../services/replyModeHandler.js';
import { trackEvent } from '../utils/analytics.js';

const router = express.Router();

// POST /api/reviews/:reviewId/approve
// Used in Semi-Auto mode for 1-3★ pending reviews
// Also used as retry for failed auto-posts
router.post('/:reviewId/approve', verifyFirebaseToken, async (req, res) => {
  const { reviewId } = req.params;
  const { editedReply } = req.body;
  const uid = req.uid;

  console.log(`✅ [POST /api/reviews/${reviewId}/approve] User: ${uid}`);

  try {
    const reviewDoc = await db
      .collection('users')
      .doc(uid)
      .collection('reviews')
      .doc(reviewId)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const reviewData = reviewDoc.data();
    const finalReply = editedReply || reviewData.currentReply || reviewData.aiReply;

    if (!finalReply) {
      return res.status(400).json({ success: false, error: 'No reply content found' });
    }

    // Validate character limit (Google's limit)
    if (finalReply.length > 4096) {
      return res.status(400).json({ success: false, error: 'Reply exceeds 4096 character limit' });
    }

    // Post to Google
    await postReplyToGoogle(uid, reviewId, finalReply);

    // Update Firestore
    await db
      .collection('users')
      .doc(uid)
      .collection('reviews')
      .doc(reviewId)
      .set({
        postedReply: finalReply,
        status: 'posted_manual',
        wasEdited: editedReply ? true : false,
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

    await trackEvent(uid, 'reply_posted', { reviewId, mode: 'manual_approval' });

    console.log(`✅ [Approve] Reply posted for review: ${reviewId}`);
    res.json({ success: true, reply: finalReply });

  } catch (err) {
    console.error(`❌ [Approve] Error for ${reviewId}:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to post reply' });
  }
});

// POST /api/reviews/bulk-reply
// Post AI replies for multiple reviews at once (max 20)
router.post('/bulk-reply', verifyFirebaseToken, async (req, res) => {
  const { reviewIds } = req.body;
  const uid = req.uid;

  console.log(`📦 [POST /api/reviews/bulk-reply] User: ${uid}, Count: ${reviewIds?.length}`);

  // Validate input
  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    return res.status(400).json({ success: false, error: 'reviewIds must be a non-empty array' });
  }

  if (reviewIds.length > 20) {
    return res.status(400).json({ success: false, error: 'Maximum 20 reviews per batch' });
  }

  const settings = await getUserSettings(uid);
  const results = { successful: 0, failed: 0, errors: [] };

  for (let i = 0; i < reviewIds.length; i++) {
    const reviewId = reviewIds[i];

    try {
      const reviewDoc = await db
        .collection('users')
        .doc(uid)
        .collection('reviews')
        .doc(reviewId)
        .get();

      if (!reviewDoc.exists) {
        results.failed++;
        results.errors.push({ reviewId, error: 'Review not found' });
        continue;
      }

      const review = reviewDoc.data();

      // Skip if already posted
      if (review.status === 'posted_auto' || review.status === 'posted_manual') {
        results.failed++;
        results.errors.push({ reviewId, error: 'Reply already posted' });
        continue;
      }

      const replyToPost = review.postedReply || review.currentReply || review.aiReply;

      if (!replyToPost) {
        results.failed++;
        results.errors.push({ reviewId, error: 'No reply content found' });
        continue;
      }

      // Post to Google
      await postReplyToGoogle(uid, reviewId, replyToPost);

      // Update Firestore
      await db
        .collection('users')
        .doc(uid)
        .collection('reviews')
        .doc(reviewId)
        .set({
          postedReply: replyToPost,
          status: 'posted_bulk',
          postedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

      results.successful++;
      console.log(`📦 [Bulk] Posted ${i + 1}/${reviewIds.length}: ${reviewId}`);

      // 500ms delay between posts to avoid rate limiting
      if (i < reviewIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (err) {
      console.error(`📦 [Bulk] Failed for ${reviewId}:`, err.message);
      results.failed++;
      results.errors.push({ reviewId, error: err.message });
    }
  }

  await trackEvent(uid, 'bulk_reply_posted', {
    total: reviewIds.length,
    successful: results.successful,
    failed: results.failed
  });

  console.log(`📦 [Bulk] Done — ${results.successful} success, ${results.failed} failed`);
  res.json({ success: true, ...results });
});

export default router;