// backend/utils/analytics.js
//
// Usage tracking system for ReviewPilot
// Tracks user events and aggregates metrics for beta feedback
//
// Usage:
//   import { trackEvent, getAnalytics } from './utils/analytics.js';
//   await trackEvent(uid, 'review_synced', { reviewCount: 5 });

import { db } from '../firebaseAdmin.js';
import admin from 'firebase-admin';

/* ─────────────────────────────────────────────────────────────
   TRACK EVENTS
───────────────────────────────────────────────────────────── */

/**
 * Track a user event
 * @param {string} uid - User ID
 * @param {string} eventName - Event name (e.g., 'review_synced')
 * @param {object} metadata - Additional data (optional)
 */
export async function trackEvent(uid, eventName, metadata = {}) {
  try {
    // 1. Log event to events collection
    await db.collection('events').add({
      userId: uid,
      event: eventName,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Update user's aggregate counts
    const updates = {};

    switch (eventName) {
      case 'user_signed_up':
        // No additional updates needed
        break;

      case 'google_connected':
        updates.googleConnectedAt = admin.firestore.FieldValue.serverTimestamp();
        break;

      case 'review_synced':
        updates.totalReviewsSynced = admin.firestore.FieldValue.increment(
          metadata.reviewCount || 0
        );
        updates.lastSyncAt = admin.firestore.FieldValue.serverTimestamp();
        break;

      case 'reply_generated':
        updates.totalRepliesGenerated = admin.firestore.FieldValue.increment(1);
        break;

      case 'reply_posted':
        updates.totalRepliesPosted = admin.firestore.FieldValue.increment(1);
        if (metadata.isAutoPosted) {
          updates.autoPostedCount = admin.firestore.FieldValue.increment(1);
        } else {
          updates.manualApprovedCount = admin.firestore.FieldValue.increment(1);
        }
        break;

      case 'reply_dismissed':
        updates.repliesDismissed = admin.firestore.FieldValue.increment(1);
        break;

      case 'sentiment_flagged':
        updates.sentimentFlaggedCount = admin.firestore.FieldValue.increment(1);
        break;

      default:
        // Track custom events without user updates
        break;
    }

    // 3. Apply updates to user document
    if (Object.keys(updates).length > 0) {
      try {
        // Check if user document exists first
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
          // Update existing document
          await db.collection('users').doc(uid).update(updates);
        } else {
          // Create new document with initial data
          await db.collection('users').doc(uid).set({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ...updates
          });
        }
      } catch (err) {
        console.error('Failed to update user stats:', err.message);
        // Don't throw - analytics failures shouldn't break the app
      }
    }

  } catch (err) {
    console.error('Analytics tracking error:', err);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/* ─────────────────────────────────────────────────────────────
   GET ANALYTICS DATA
───────────────────────────────────────────────────────────── */

/**
 * Get overall analytics for admin dashboard
 * @returns {object} Analytics summary
 */
export async function getAnalytics() {
  try {
    // 1. Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // 2. Calculate active users (synced in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeSnapshot = await db
      .collection('users')
      .where('lastSyncAt', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();
    const activeUsers = activeSnapshot.size;

    // 3. Aggregate totals
    let totalReviewsSynced = 0;
    let totalRepliesGenerated = 0;
    let totalRepliesPosted = 0;
    let autoPostedCount = 0;
    let manualApprovedCount = 0;
    let sentimentFlaggedCount = 0;
    let connectedUsersCount = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalReviewsSynced += data.totalReviewsSynced || 0;
      totalRepliesGenerated += data.totalRepliesGenerated || 0;
      totalRepliesPosted += data.totalRepliesPosted || 0;
      autoPostedCount += data.autoPostedCount || 0;
      manualApprovedCount += data.manualApprovedCount || 0;
      sentimentFlaggedCount += data.sentimentFlaggedCount || 0;
      if (data.googleConnectedAt) connectedUsersCount++;
    });

    // 4. Get recent feedback
    const feedbackSnapshot = await db
      .collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const recentFeedback = feedbackSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 5. Calculate conversion rate
    const connectionRate = totalUsers > 0 
      ? Math.round((connectedUsersCount / totalUsers) * 100)
      : 0;

    const autoPostRate = totalReviewsSynced > 0
      ? Math.round((autoPostedCount / totalReviewsSynced) * 100)
      : 0;

    // 6. Get top users by activity
    const topUsersSnapshot = await db
      .collection('users')
      .orderBy('totalRepliesPosted', 'desc')
      .limit(10)
      .get();

    const topUsers = topUsersSnapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email,
      businessName: doc.data().settings?.businessName || 'N/A',
      totalReviewsSynced: doc.data().totalReviewsSynced || 0,
      totalRepliesPosted: doc.data().totalRepliesPosted || 0,
    }));

    // 7. Calculate average feedback rating
    const feedbackWithRatings = recentFeedback.filter(f => f.rating);
    const avgFeedbackRating = feedbackWithRatings.length > 0
      ? (feedbackWithRatings.reduce((sum, f) => sum + f.rating, 0) / feedbackWithRatings.length).toFixed(1)
      : 0;

    return {
      // User metrics
      totalUsers,
      activeUsers,
      connectedUsersCount,
      connectionRate,

      // Activity metrics
      totalReviewsSynced,
      totalRepliesGenerated,
      totalRepliesPosted,
      autoPostedCount,
      manualApprovedCount,
      sentimentFlaggedCount,

      // Calculated metrics
      avgReviewsPerUser: totalUsers > 0 ? Math.round(totalReviewsSynced / totalUsers) : 0,
      avgRepliesPerUser: totalUsers > 0 ? Math.round(totalRepliesPosted / totalUsers) : 0,
      autoPostRate,

      // Feedback
      recentFeedback,
      avgFeedbackRating,
      totalFeedbackCount: feedbackSnapshot.size,

      // Top users
      topUsers,

      // Timestamp
      generatedAt: new Date().toISOString(),
    };

  } catch (err) {
    console.error('Get analytics error:', err);
    throw new Error('Failed to fetch analytics');
  }
}

/* ─────────────────────────────────────────────────────────────
   GET USER ANALYTICS
───────────────────────────────────────────────────────────── */

/**
 * Get analytics for a specific user
 * @param {string} uid - User ID
 * @returns {object} User analytics
 */
export async function getUserAnalytics(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Get user's events from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const eventsSnapshot = await db
      .collection('events')
      .where('userId', '==', uid)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('timestamp', 'desc')
      .get();

    const recentEvents = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count events by type
    const eventCounts = {};
    recentEvents.forEach((event) => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    });

    return {
      userId: uid,
      email: userData.email,
      businessName: userData.settings?.businessName || 'Not set',
      createdAt: userData.createdAt,
      
      // Totals
      totalReviewsSynced: userData.totalReviewsSynced || 0,
      totalRepliesGenerated: userData.totalRepliesGenerated || 0,
      totalRepliesPosted: userData.totalRepliesPosted || 0,
      autoPostedCount: userData.autoPostedCount || 0,
      manualApprovedCount: userData.manualApprovedCount || 0,
      
      // Recent activity
      lastSyncAt: userData.lastSyncAt,
      recentEvents,
      eventCounts,
    };

  } catch (err) {
    console.error('Get user analytics error:', err);
    throw err;
  }
}

/* ─────────────────────────────────────────────────────────────
   EXAMPLE USAGE IN ROUTES
───────────────────────────────────────────────────────────── */

/*
// In your backend routes:

import { trackEvent, getAnalytics, getUserAnalytics } from './utils/analytics.js';

// Track signup
app.post('/api/signup', async (req, res) => {
  // ... create user ...
  await trackEvent(uid, 'user_signed_up');
});

// Track Google connection
app.get('/auth/google/callback', async (req, res) => {
  // ... handle OAuth ...
  await trackEvent(uid, 'google_connected');
});

// Track review sync
app.post('/api/reviews/sync', async (req, res) => {
  const reviews = await fetchGoogleReviews(uid);
  await trackEvent(uid, 'review_synced', { reviewCount: reviews.length });
});

// Track reply generation
app.post('/api/replies/generate', async (req, res) => {
  // ... generate reply ...
  await trackEvent(uid, 'reply_generated', { reviewId });
});

// Track reply posting
app.post('/api/reviews/post', async (req, res) => {
  const { isAutoPosted } = req.body;
  await trackEvent(uid, 'reply_posted', { reviewId, isAutoPosted });
});

// Admin route to view analytics
app.get('/api/admin/analytics', verifyAdminToken, async (req, res) => {
  const analytics = await getAnalytics();
  res.json(analytics);
});

// User route to view their own stats
app.get('/api/user/analytics', verifyFirebaseToken, async (req, res) => {
  const analytics = await getUserAnalytics(req.uid);
  res.json(analytics);
});
*/
