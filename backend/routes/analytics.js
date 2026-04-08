// backend/routes/analytics.js
//
// Add these routes to your backend/index.js:
// import analyticsRoutes from './routes/analytics.js';
// app.use('/api', analyticsRoutes);

import express from 'express';
import { getAnalytics, getUserAnalytics } from '../utils/analytics.js';
import { db } from '../firebaseAdmin.js';
import admin from 'firebase-admin';

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   MIDDLEWARE: Verify Firebase Token
───────────────────────────────────────────────────────────── */

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ─────────────────────────────────────────────────────────────
   MIDDLEWARE: Verify Admin
   
   SECURITY NOTE: In production, add proper admin role checking!
   For now, we'll use a simple email allowlist.
───────────────────────────────────────────────────────────── */

async function verifyAdminToken(req, res, next) {
  await verifyFirebaseToken(req, res, async () => {
    // Admin emails list
    const ADMIN_EMAILS = [
      'guptarahul07@gmail.com',
      // Add more admin emails here if needed
    ];

    if (!ADMIN_EMAILS.includes(req.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  });
}

/* ─────────────────────────────────────────────────────────────
   ROUTE: Get Overall Analytics (Admin Only)
───────────────────────────────────────────────────────────── */

router.get('/admin/analytics', verifyAdminToken, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/* ─────────────────────────────────────────────────────────────
   ROUTE: Get User's Own Analytics
───────────────────────────────────────────────────────────── */

router.get('/user/analytics', verifyFirebaseToken, async (req, res) => {
  try {
    const analytics = await getUserAnalytics(req.uid);
    res.json(analytics);
  } catch (err) {
    console.error('Get user analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch your analytics' });
  }
});

/* ─────────────────────────────────────────────────────────────
   ROUTE: Submit Feedback
───────────────────────────────────────────────────────────── */

router.post('/feedback', verifyFirebaseToken, async (req, res) => {
  try {
    const { rating, comment, feature } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({ error: 'Comment too long (max 1000 chars)' });
    }

    // Save feedback
    const feedbackDoc = await db.collection('feedback').add({
      userId: req.uid,
      userEmail: req.email,
      rating: rating || null,
      comment: comment || null,
      feature: feature || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ 
      success: true, 
      feedbackId: feedbackDoc.id,
      message: 'Thank you for your feedback!' 
    });

  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/* ─────────────────────────────────────────────────────────────
   ROUTE: Get All Feedback (Admin Only)
───────────────────────────────────────────────────────────── */

router.get('/admin/feedback', verifyAdminToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const snapshot = await db
      .collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ feedback, total: snapshot.size });

  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;


/* ─────────────────────────────────────────────────────────────
   INTEGRATION INSTRUCTIONS
───────────────────────────────────────────────────────────── */

/*

1. CREATE THIS FILE:
   backend/routes/analytics.js

2. UPDATE backend/index.js:

   import analyticsRoutes from './routes/analytics.js';
   
   // Add after other middleware
   app.use('/api', analyticsRoutes);

3. UPDATE ADMIN EMAIL:
   Line 40 in this file - replace with your actual email

4. TEST ENDPOINTS:

   Admin Analytics:
   GET /api/admin/analytics
   Headers: Authorization: Bearer <firebase-token>

   User Analytics:
   GET /api/user/analytics
   Headers: Authorization: Bearer <firebase-token>

   Submit Feedback:
   POST /api/feedback
   Headers: Authorization: Bearer <firebase-token>
   Body: { rating: 5, comment: "Great app!", feature: "auto-post" }

   Get Feedback (Admin):
   GET /api/admin/feedback?limit=50
   Headers: Authorization: Bearer <firebase-token>

*/
