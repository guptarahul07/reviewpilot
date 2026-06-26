// backend/routes/user.js
// User profile, onboarding state, account lifecycle, waitlist

import express from 'express';
import { db } from '../firebaseAdmin.js';
import admin from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { sanitizeString } from '../utils/sanitize.js';
import { sendWaitlistConfirmationEmail } from '../services/emailService.js';
import { trackEvent } from '../utils/analytics.js';

const router = express.Router();

const VALID_BUSINESS_TYPES = [
  'restaurant', 'cafe', 'hotel', 'salon',
  'app_developer', 'retail', 'other'
];

// ─────────────────────────────────────────────
// GET /api/user/profile
// ─────────────────────────────────────────────
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.json({ success: true, profile: null });
    }

    const userData = userDoc.data() || {};
    // profile is stored as nested map — direct access works fine here
    const profile = userData.profile || {};
    console.log(`👤 [GET /api/user/profile] uid: ${uid}, profile keys: ${Object.keys(profile)}, raw profile:`, JSON.stringify(profile));
    res.json({ success: true, profile });

  } catch (err) {
    console.error('[GET /api/user/profile] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/user/profile
// ─────────────────────────────────────────────
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { displayName, phone, businessType, businessName, city, state, howHeard } = req.body;

  // Validate businessType if provided
  if (businessType && !VALID_BUSINESS_TYPES.includes(businessType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid businessType. Must be one of: ${VALID_BUSINESS_TYPES.join(', ')}`
    });
  }

  // Validate phone format if provided
  if (phone && !/^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number. Must be a valid Indian mobile number.'
    });
  }

  const profileUpdate = {
    ...(displayName && { displayName: sanitizeString(displayName, 100) }),
    ...(phone && { phone: sanitizeString(phone, 15) }),
    ...(businessType && { businessType }),
    ...(businessName && { businessName: sanitizeString(businessName, 100) }),
    ...(city && { city: sanitizeString(city, 50) }),
    ...(state && { state: sanitizeString(state, 50) }),
    ...(howHeard && { howHeard: sanitizeString(howHeard, 50) }),
    updatedAt: new Date()
  };

  try {
    const start = Date.now();

    // Use dotted keys to update only specific fields — prevents overwriting entire profile map
    const firestoreUpdate = {};
    for (const [key, value] of Object.entries(profileUpdate)) {
      firestoreUpdate[`profile.${key}`] = value;
    }

    // Use set+merge as fallback if doc doesn't exist (new user)
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();
    if (userSnap.exists) {
      await userDocRef.update(firestoreUpdate);
    } else {
      await userDocRef.set({ profile: profileUpdate }, { merge: true });
    }

    console.log(`✅ [PUT /api/user/profile] Updated for user: ${uid} in ${Date.now() - start}ms`);
    res.json({ success: true, profile: profileUpdate });

  } catch (err) {
    console.error('[PUT /api/user/profile] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/user/onboarding
// Track onboarding progress
// ─────────────────────────────────────────────
router.put('/onboarding', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { step, data } = req.body;

  if (!step || step < 1 || step > 4) {
    return res.status(400).json({ success: false, error: 'Invalid step. Must be 1-4.' });
  }

  try {
    const update = {
      'profile.onboardingStep': step,
      'profile.onboardingCompleted': step === 4,
      'profile.updatedAt': new Date()
    };

    // Save any step-specific data
    if (data && step === 1) {
      if (data.businessType) update['profile.businessType'] = data.businessType;
      if (data.city) update['profile.city'] = sanitizeString(data.city, 50);
    }

    await db.collection('users').doc(uid).update(update);

    await trackEvent(uid, 'onboarding_step_completed', { step });

    if (step === 4) {
      await trackEvent(uid, 'onboarding_completed', {});
    }

    console.log(`✅ [PUT /api/user/onboarding] Step ${step} for user: ${uid}`);
    res.json({ success: true, step, completed: step === 4 });

  } catch (err) {
    console.error('[PUT /api/user/onboarding] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update onboarding' });
  }
});

// ─────────────────────────────────────────────
// POST /api/waitlist/insights
// InsightPilot waitlist signup
// ─────────────────────────────────────────────
router.post('/waitlist/insights', async (req, res) => {
  const { email, businessType } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }

  try {
    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if already on waitlist
    const existing = await db.collection('waitlist').doc('insights')
      .collection('entries').doc(docId).get();

    if (existing.exists) {
      return res.json({ success: true, alreadyOnList: true, message: 'You are already on the waitlist!' });
    }

    await db.collection('waitlist').doc('insights')
      .collection('entries').doc(docId).set({
        email: email.toLowerCase(),
        businessType: businessType || null,
        joinedAt: new Date(),
        source: 'website'
      });

    // Send confirmation email
    await sendWaitlistConfirmationEmail({ to: email });

    await trackEvent(null, 'waitlist_joined', { email, product: 'insights' });

    console.log(`✅ Waitlist signup: ${email}`);
    res.json({ success: true, message: 'You are on the waitlist! We will notify you when InsightPilot launches.' });

  } catch (err) {
    console.error('[POST /api/waitlist/insights] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to join waitlist' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/user/account
// Soft delete — DPDP Act compliance
// Hard delete after 30 days via cron
// ─────────────────────────────────────────────
router.delete('/account', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const email = req.email;

  console.log(`🗑️ [DELETE /api/user/account] User: ${uid}`);

  try {
    // Soft delete — anonymize personal data, mark as deleted
    await db.collection('users').doc(uid).set({
      deleted: true,
      deletedAt: new Date(),
      hardDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      // Anonymize PII
      email: `deleted_${uid}@deleted.com`,
      displayName: 'Deleted User',
      'profile.displayName': 'Deleted User',
      'profile.phone': null,
      'profile.city': null,
      // Revoke tokens
      'google.connected': false,
      'playAuth.connected': false,
      // Cancel subscription
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': new Date()
    }, { merge: true });

    // Disable Firebase Auth account
    try {
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (authErr) {
      console.warn('[DELETE account] Could not disable auth:', authErr.message);
    }

    await trackEvent(uid, 'account_deleted', { email });

    console.log(`✅ Account soft-deleted for user: ${uid}`);
    res.json({
      success: true,
      message: 'Your account has been scheduled for deletion. All data will be permanently deleted within 30 days.'
    });

  } catch (err) {
    console.error('[DELETE /api/user/account] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

// ─────────────────────────────────────────────
// GET /api/user/export
// Data export — returns user's data as JSON
// Full ZIP export is a future enhancement
// ─────────────────────────────────────────────
router.get('/export', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`📦 [GET /api/user/export] User: ${uid}`);

  try {
    const [userDoc, reviewsSnapshot, settingsDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('reviews').get(),
      db.collection('users').doc(uid).collection('settings').doc('preferences').get()
    ]);

    const userData = userDoc.data() || {};

    // Remove sensitive fields
    const { googleRefreshToken, playAuth, ...safeUserData } = userData;

    const reviews = reviewsSnapshot.docs.map(doc => {
      const { aiReply, ...reviewData } = doc.data();
      return reviewData;
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: safeUserData.profile || {},
      subscription: safeUserData.subscription || {},
      settings: settingsDoc.data() || {},
      reviews,
      totalReviews: reviews.length
    };

    res.setHeader('Content-Disposition', 'attachment; filename="reviewpilot-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);

  } catch (err) {
    console.error('[GET /api/user/export] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;