import { db } from '../firebaseAdmin.js';
import { postReplyToGoogle } from './googleReviews.js';

// Fetch user settings — returns defaults if not set
export async function getUserSettings(uid) {
  const settingsDoc = await db
    .collection('users')
    .doc(uid)
    .collection('settings')
    .doc('preferences')
    .get();

  if (!settingsDoc.exists) {
    return {
      replyMode: 'manual',
      tone: 'professional',
      businessName: '',
      replyToRatingOnly: false,
      customInstructions: ''
    };
  }
  return settingsDoc.data();
}

// Save reply state to Firestore
async function saveReplyState(uid, reviewId, data) {
  await db
    .collection('users')
    .doc(uid)
    .collection('reviews')
    .doc(reviewId)
    .set(data, { merge: true });
}

// Check if review should be skipped (rating-only, no text)
export function shouldSkipReview(review, settings) {
  const hasNoText = !review.text || review.text.trim() === '';
  return hasNoText && !settings.replyToRatingOnly;
}

// MANUAL MODE
// AI generates reply, saves as draft_ready
// User must copy-paste to Google Business manually — app never posts
export async function handleManualMode(uid, review, aiReply) {
  console.log(`[Manual] Saving draft for ${review.rating}★ review: ${review.id}`);

  await saveReplyState(uid, review.id, {
    aiReply,
    mode: 'manual',
    status: 'draft_ready',
    updatedAt: new Date().toISOString()
  });

  return { generated: true, reply: aiReply, status: 'draft_ready' };
}

// SEMI-AUTO MODE
// 4-5★ → auto-post immediately
// 1-3★ → save as pending_approval, user must approve before posting
export async function handleSemiAutoMode(uid, review, aiReply) {
  if (review.rating >= 4) {
    // Auto-post for positive reviews
    try {
      console.log(`[Semi-Auto] Auto-posting ${review.rating}★ review: ${review.id}`);
      await postReplyToGoogle(uid, review.id, aiReply);

      await saveReplyState(uid, review.id, {
        aiReply,
        postedReply: aiReply,
        mode: 'semi-auto',
        status: 'posted_auto',
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`[Semi-Auto] ✅ Auto-posted for review: ${review.id}`);
      return { posted: true, reply: aiReply, status: 'posted_auto' };

    } catch (err) {
      console.error(`[Semi-Auto] ❌ Auto-post failed for ${review.id}:`, err.message);

      // Save as pending_approval so user can retry manually
      await saveReplyState(uid, review.id, {
        aiReply,
        mode: 'semi-auto',
        status: 'failed_needs_approval',
        error: err.message,
        updatedAt: new Date().toISOString()
      });

      return { posted: false, needsApproval: true, error: err.message };
    }

  } else {
    // 1-3★ — needs manual approval before posting
    console.log(`[Semi-Auto] ${review.rating}★ review saved for approval: ${review.id}`);

    await saveReplyState(uid, review.id, {
      aiReply,
      currentReply: aiReply,
      mode: 'semi-auto',
      status: 'pending_approval',
      updatedAt: new Date().toISOString()
    });

    return { generated: true, needsApproval: true, reply: aiReply, status: 'pending_approval' };
  }
}

// AUTO MODE
// All reviews (1-5★) auto-posted, zero user intervention
export async function handleAutoMode(uid, review, aiReply) {
  try {
    console.log(`[Auto] Auto-posting ${review.rating}★ review: ${review.id}`);
    await postReplyToGoogle(uid, review.id, aiReply);

    await saveReplyState(uid, review.id, {
      aiReply,
      postedReply: aiReply,
      mode: 'auto',
      status: 'posted_auto',
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`[Auto] ✅ Posted for review: ${review.id}`);
    return { posted: true, reply: aiReply, status: 'posted_auto' };

  } catch (err) {
    console.error(`[Auto] ❌ Post failed for ${review.id}:`, err.message);

    await saveReplyState(uid, review.id, {
      aiReply,
      mode: 'auto',
      status: 'failed',
      error: err.message,
      updatedAt: new Date().toISOString()
    });

    return { posted: false, error: err.message, status: 'failed' };
  }
}