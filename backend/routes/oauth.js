// backend/routes/oauth.js
import express from 'express';
import { 
  getAuthUrl, 
  exchangeCodeForTokens, 
  getUserBusinessLocations, 
  storeUserTokens 
} from '../services/googleOAuth.js';
import { trackEvent } from '../utils/analytics.js';
import admin from 'firebase-admin';

const router = express.Router();

// Middleware: Verify Firebase token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * GET /auth/google/connect
 * Returns OAuth URL for user to authorize
 */
router.get('/auth/google/connect', verifyFirebaseToken, (req, res) => {
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
    
    let businessInfo;
    try {
      businessInfo = await getUserBusinessLocations(tokens);
      console.log(`✅ Real business info: ${businessInfo.businessName}`);
    } catch (err) {
      console.warn('⚠️ Could not fetch business from API, using mock data');
      businessInfo = {
        accountId: 'pending-verification',
        locationId: 'pending-verification',
        businessName: 'Test Cafe (Pending API Sync)',
        businessAddress: 'Second Floor, E 3, East Ram Nagar, Mansarovar'
      };
    }
    
    await storeUserTokens(uid, tokens, businessInfo);
    console.log('✅ Tokens stored in Firestore');
    
    await trackEvent(uid, 'google_connected', {
      businessName: businessInfo.businessName,
      locationId: businessInfo.locationId
    });
    
    console.log(`🎉 Google connection successful for user: ${uid}`);
    
    // Redirect back to the same domain that initiated the flow
    res.redirect(`${origin}/connect?connected=true`);
    
  } catch (err) {
    console.error('OAuth callback processing error:', err);
    res.redirect(`${origin}/connect?error=connection_failed`);
  }
});

export default router;