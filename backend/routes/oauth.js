// backend/routes/oauth.js
import express from 'express';
import { 
  getAuthUrl, 
  exchangeCodeForTokens, 
  getUserBusinessLocations, 
  storeUserTokens 
} from '../services/googleOAuth.js';
import { trackEvent } from '../utils/analytics.js';
import { refreshBusinessProfileIfNeeded } from '../services/businessProfileService.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import admin from '../firebaseAdmin.js';

const router = express.Router();

/**
 * GET /auth/google/connect
 * Returns OAuth URL for user to authorize
 */
router.get('/auth/google/connect', authLimiter, verifyFirebaseToken, (req, res) => {
  try {
    console.log('🧪 CONNECT ROUTE HIT - origin header:', req.headers.origin);
    // Capture origin from request header (e.g. https://reviewpilot-one.vercel.app)
    const origin = req.headers.origin || req.headers.referer || 'https://reviewpilot.live';
    
    // Strip trailing slash and path from referer if present
    const originDomain = origin.replace(/\/$/, '').split('/').slice(0, 3).join('/');

    //console.log('🔑 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    //console.log('🔑 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
    //console.log('🔑 GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    console.log('👤 User ID:', req.uid);
    console.log('🌐 Origin domain:', originDomain);
    
    const authUrl = getAuthUrl(req.uid, originDomain);
    
    console.log('🔗 Generated OAuth URL for user:', req.uid);
    
    res.json({ url: authUrl });
    
  } catch (err) {
    console.error('❌ Generate auth URL error:', err);
    res.status(500).json({ 
      error: 'Failed to generate Google authorization URL',
      details: err.message
    });
  }
});

/**
 * GET /auth/google/callback
 * Handles OAuth callback from Google
 */
router.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Decode state to get uid + origin
  let uid, origin;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    uid = decoded.uid;
    origin = decoded.origin || 'https://reviewpilot.live';
  } catch {
    // Fallback: treat state as plain uid (backward compat)
    uid = state;
    origin = 'https://reviewpilot.live';
  }

  //console.log('📩 OAuth callback received, uid:', uid, 'origin:', origin);

  if (error) {
    console.error('OAuth error from Google:', error);
    return res.redirect(`${origin}/connect?error=auth_denied`);
  }
  
  if (!code || !uid) {
    console.error('Missing code or uid in callback');
    return res.redirect(`${origin}/connect?error=missing_params`);
  }
  
  try {
    console.log(`🔄 Exchanging code for tokens (user: ${uid})`);
    
    const tokens = await exchangeCodeForTokens(code);
    console.log('✅ Tokens received from Google');
    
    // Part 2 — Save tokens only, fetch all locations, redirect to picker
    // Do NOT auto-connect any location here
    const { encrypt } = await import('../utils/crypto.js');
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    const { db } = await import('../firebaseAdmin.js');

    await db.collection('users').doc(uid).set({
      googleRefreshToken: encryptedRefreshToken,
      googleConnectedAt: new Date(),
      google: {
        connected: false, // not fully connected until location selected
        tokenSavedAt: new Date()
      }
    }, { merge: true });

    console.log('✅ Tokens stored for user:', uid);

    // Fetch all locations and save for location picker
    let locationsData = null;
    try {
      locationsData = await getUserBusinessLocations(tokens);
      console.log(`✅ Found ${locationsData.locations.length} location(s) for user: ${uid}`);

      await db.collection('users').doc(uid).set({
        googleAccountId: locationsData.accountId,
        googleAccountName: locationsData.accountName,
        gbpLocations: locationsData.locations
      }, { merge: true });

    } catch (err) {
      console.warn('⚠️ Could not fetch locations:', err.message);
    }

    await trackEvent(uid, 'platform_connected', { platform: 'gbp', step: 'token_saved' });

    console.log(`🎉 Tokens saved, redirecting to location picker for user: ${uid}`);

    // Redirect to location selection page
    res.redirect(`${origin}/connect/select-locations`);
    
  } catch (err) {
    console.error('OAuth callback processing error:', err);
    res.redirect(`${origin}/connect?error=connection_failed`);
  }
});

// ─────────────────────────────────────────────
// POST /auth/google/refresh-business-info
// Re-fetches real accountId/locationId for users stuck with pending-verification
// Call this once after Google API quota approval
// ─────────────────────────────────────────────
router.post('/auth/google/refresh-business-info', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`🔄 [refresh-business-info] Fetching real business info for user: ${uid}`);

  try {
    const { db } = await import('../firebaseAdmin.js');
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.google?.connected) {
      return res.status(400).json({ success: false, error: 'Google account not connected' });
    }

    // Get existing tokens and use them to fetch business info
    const { getAuthenticatedClient } = await import('../services/googleOAuth.js');
    const { getUserBusinessLocations } = await import('../services/googleOAuth.js');

    // Get current tokens to pass to getUserBusinessLocations
    const { decrypt } = await import('../utils/crypto.js');
    const encryptedRefreshToken = userData.googleRefreshToken;

    if (!encryptedRefreshToken) {
      return res.status(400).json({ success: false, error: 'No refresh token found. Please reconnect.' });
    }

    const refreshToken = decrypt(encryptedRefreshToken);
    const businessInfo = await getUserBusinessLocations({ refresh_token: refreshToken });

    // Update Firestore with real IDs
    await db.collection('users').doc(uid).update({
      googleAccountId: businessInfo.accountId,
      googleLocationId: businessInfo.locationId,
      'settings.businessName': businessInfo.businessName,
      businessAddress: businessInfo.businessAddress
    });

    console.log(`✅ [refresh-business-info] Updated for user: ${uid} — ${businessInfo.businessName}`);
    res.json({
      success: true,
      businessName: businessInfo.businessName,
      accountId: businessInfo.accountId,
      locationId: businessInfo.locationId
    });

  } catch (err) {
    console.error('❌ [refresh-business-info] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;