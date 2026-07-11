// backend/routes/gbp.js
// Google Business Profile location management
// Handles location picker after OAuth

import express from 'express';
import { db } from '../firebaseAdmin.js';
import admin from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/googleOAuth.js';
import { fetchGoogleReviews } from '../services/googleReviews.js';
import { analyzeSentiment } from '../services/sentimentAnalysis.js';
import { trackEvent } from '../utils/analytics.js';
import { refreshBusinessProfileIfNeeded } from '../services/businessProfileService.js';

const router = express.Router();

// Plan limits for GBP locations
const GBP_LOCATION_LIMITS = {
  starter: 1, gbp_starter: 1,
  growth: 3, gbp_growth: 3,
  bundle_starter: 1, bundle_growth: 3,
  professional: 999, gbp_pro: 999, bundle_suite: 999,
  trial: 1, admin: 999
};

function getLocationLimit(plan) {
  return GBP_LOCATION_LIMITS[plan] ?? 1;
}

// ─────────────────────────────────────────────
// GET /api/gbp/locations
// Returns all available locations for the authenticated user
// Frontend calls this to populate location picker
// ─────────────────────────────────────────────
router.get('/locations', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`📍 [GET /api/gbp/locations] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    const locations = userData.gbpLocations || [];

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No locations found. Please reconnect your Google account.'
      });
    }

    const plan = userData.subscription?.plan || userData.plan || 'trial';
    const limit = getLocationLimit(plan);
    const connectedCount = (userData.connectedLocations || []).length;

    res.json({
      success: true,
      locations,
      plan,
      limit,
      connectedCount,
      canConnectMore: connectedCount < limit,
      // Frontend hint — if only 1 location, auto-connect without showing picker
      autoConnect: locations.length === 1
    });

  } catch (err) {
    console.error('❌ [GET /api/gbp/locations] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

// ─────────────────────────────────────────────
// POST /api/gbp/locations/connect
// User selects which location(s) to connect
// Body: { locationIds: ["123456789"] }
// ─────────────────────────────────────────────
router.post('/locations/connect', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { locationIds } = req.body;

  console.log(`📍 [POST /api/gbp/locations/connect] User: ${uid}, locationIds:`, locationIds);

  if (!Array.isArray(locationIds) || locationIds.length === 0) {
    return res.status(400).json({ success: false, error: 'locationIds must be a non-empty array' });
  }

  // Reject null/undefined values in the array
  const invalidIds = locationIds.filter(id => !id);
  if (invalidIds.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_LOCATION_ID',
      message: 'locationIds contains null or undefined values. Please select a valid location.'
    });
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const availableLocations = userData.gbpLocations || [];

    // Validate — all selected locationIds must exist in gbpLocations
    const selectedLocations = locationIds.map(id => {
      const loc = availableLocations.find(l => l.locationId === id);
      if (!loc) throw new Error(`Location ${id} not found in your account`);
      return loc;
    });

    // Part 3 Check 1 — Reject permanently closed locations
    const closedLocations = selectedLocations.filter(l => l.isClosed);
    if (closedLocations.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'LOCATION_PERMANENTLY_CLOSED',
        message: `Cannot connect closed location(s): ${closedLocations.map(l => l.displayName).join(', ')}`,
        closedLocations: closedLocations.map(l => ({ locationId: l.locationId, displayName: l.displayName }))
      });
    }

    // Part 3 Check 2 — Plan limit check
    const plan = userData.subscription?.plan || userData.plan || 'trial';
    const limit = getLocationLimit(plan);
    const currentConnected = (userData.connectedLocations || []).length;
    const totalAfterConnect = currentConnected + selectedLocations.length;

    if (totalAfterConnect > limit) {
      return res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_EXCEEDED',
        message: `Your ${plan} plan supports up to ${limit} location(s). You have ${currentConnected} connected and are trying to add ${selectedLocations.length} more.`,
        limit,
        currentConnected,
        upgradeUrl: '/pricing'
      });
    }

    // Part 3 Step 3 — Save selected locations to Firestore
    const primaryLocation = selectedLocations[0]; // first selected = primary

    await db.collection('users').doc(uid).set({
      // Primary location (backward compatible)
      googleAccountId: primaryLocation.accountId,
      googleLocationId: primaryLocation.locationId,
      businessAddress: primaryLocation.businessAddress,
      // All connected locations
      connectedLocations: admin.firestore.FieldValue.arrayUnion(...selectedLocations.map(l => ({
        locationId: l.locationId,
        locationName: l.locationName,
        accountId: l.accountId,
        displayName: l.displayName,
        city: l.city,
        connectedAt: new Date()
      }))),
      google: {
        connected: true,
        connectedAt: new Date()
      },
      settings: {
        businessName: primaryLocation.displayName
      },
      // Update usage
      'usage.locationsConnected': selectedLocations.length + currentConnected
    }, { merge: true });

    console.log(`✅ [gbp/locations/connect] Connected ${selectedLocations.length} location(s) for user: ${uid}`);

    // Part 3 Step 4 — Trigger initial review sync for selected locations
    const syncResults = [];
    for (const loc of selectedLocations) {
      try {
        console.log(`🔄 [gbp/locations/connect] Triggering initial sync for ${loc.displayName}`);

        // Ensure user doc has correct locationId before fetching
        await db.collection('users').doc(uid).update({
          googleLocationId: loc.locationId,
          googleAccountId: loc.accountId
        });

        const reviews = await fetchGoogleReviews(uid);
        console.log(`🔄 [gbp/locations/connect] Saving ${reviews.length} reviews to Firestore`);

        // Save each review to Firestore with sentiment
        const firestoreBatch = db.batch();
        for (const review of reviews) {
          const sentiment = analyzeSentiment(review.text || '', review.rating);
          const reviewRef = db
            .collection('users')
            .doc(uid)
            .collection('reviews')
            .doc(review.id);

          firestoreBatch.set(reviewRef, {
            ...review,
            sentiment: sentiment.label,
            sentimentAnalysis: sentiment.indicators,
            hasMixedSentiment: sentiment.isMixed,
            status: 'pending',
            syncedAt: new Date()
          }, { merge: true });
        }
        await firestoreBatch.commit();

        // Update lastSyncAt
        await db.collection('users').doc(uid).set({
          lastSyncAt: new Date()
        }, { merge: true });

        syncResults.push({ locationId: loc.locationId, displayName: loc.displayName, reviewCount: reviews.length });
        console.log(`✅ [gbp/locations/connect] Saved ${reviews.length} reviews for ${loc.displayName}`);

        // Trigger business profile cache
        try {
          await refreshBusinessProfileIfNeeded(uid, loc.locationId);
        } catch (profileErr) {
          console.warn(`[gbp/locations/connect] Profile cache failed for ${loc.locationId}:`, profileErr.message);
        }

      } catch (syncErr) {
        console.warn(`[gbp/locations/connect] Initial sync failed for ${loc.locationId}:`, syncErr.message);
        syncResults.push({ locationId: loc.locationId, displayName: loc.displayName, reviewCount: 0, error: syncErr.message });
      }
    }

    await trackEvent(uid, 'google_connected', {
      locationCount: selectedLocations.length,
      plan
    });
    await trackEvent(uid, 'platform_connected', { platform: 'gbp', locationCount: selectedLocations.length });

    res.json({
      success: true,
      connectedLocations: selectedLocations.map(l => ({
        locationId: l.locationId,
        displayName: l.displayName,
        city: l.city
      })),
      syncResults,
      message: `Successfully connected ${selectedLocations.length} location(s)`
    });

  } catch (err) {
    console.error('❌ [POST /api/gbp/locations/connect] Error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to connect location' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/gbp/locations/:locationId
// Disconnect a specific location
// ─────────────────────────────────────────────
router.delete('/locations/:locationId', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { locationId } = req.params;

  console.log(`📍 [DELETE /api/gbp/locations/${locationId}] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const connectedLocations = userData.connectedLocations || [];

    const locationToRemove = connectedLocations.find(l => l.locationId === locationId);
    if (!locationToRemove) {
      return res.status(404).json({ success: false, error: 'Location not found in connected list' });
    }

    const updatedLocations = connectedLocations.filter(l => l.locationId !== locationId);

    await db.collection('users').doc(uid).set({
      connectedLocations: updatedLocations,
      // If removed primary, update to next available
      ...(userData.googleLocationId === locationId && updatedLocations.length > 0 ? {
        googleLocationId: updatedLocations[0].locationId,
        googleAccountId: updatedLocations[0].accountId,
        settings: { businessName: updatedLocations[0].displayName }
      } : {}),
      // If no locations left, mark as disconnected
      ...(updatedLocations.length === 0 ? {
        google: { connected: false, disconnectedAt: new Date() }
      } : {})
    }, { merge: true });

    await trackEvent(uid, 'platform_disconnected', { platform: 'gbp', locationId });

    res.json({ success: true, message: `Location ${locationId} disconnected`, remainingCount: updatedLocations.length });

  } catch (err) {
    console.error(`❌ [DELETE /api/gbp/locations/${locationId}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to disconnect location' });
  }
});

export default router;