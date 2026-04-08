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
    console.log('🔑 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('🔑 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
    console.log('🔑 GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    console.log('👤 User ID:', req.uid);
    
    const authUrl = getAuthUrl(req.uid);
    
    console.log('🔗 Generated OAuth URL for user:', req.uid);
    console.log('🔗 Auth URL:', authUrl.substring(0, 100) + '...');
    
    res.json({ url: authUrl });
    
  } catch (err) {
    console.error('❌ Generate auth URL error:', err);
    console.error('❌ Error stack:', err.stack);
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
  const { code, state: uid, error } = req.query;
  
  console.log('📩 OAuth callback received');
  
  if (error) {
    console.error('OAuth error from Google:', error);
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://reviewpilot.live/connect?error=auth_denied'
      : 'http://localhost:5173/connect?error=auth_denied';
    return res.redirect(redirectUrl);
  }
  
  if (!code || !uid) {
    console.error('Missing code or uid in callback');
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://reviewpilot.live/connect?error=missing_params'
      : 'http://localhost:5173/connect?error=missing_params';
    return res.redirect(redirectUrl);
  }
  
  try {
    console.log(`🔄 Exchanging code for tokens (user: ${uid})`);
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('✅ Tokens received from Google');
    
    // Try to get business info, use mock if fails
    let businessInfo;
    try {
      businessInfo = await getUserBusinessLocations(tokens);
      console.log(`✅ Real business info: ${businessInfo.businessName}`);
    } catch (err) {
      console.warn('⚠️ Could not fetch business from API (might be too new)');
      console.warn('⚠️ Error:', err.message);
      console.warn('⚠️ Using mock data for now - real business will sync later');
      
      // Use mock data (you can update this info in Firestore manually later)
      businessInfo = {
        accountId: 'pending-verification',
        locationId: 'pending-verification',
        businessName: 'Test Cafe (Pending API Sync)',
        businessAddress: 'Second Floor, E 3, East Ram Nagar, Mansarovar'
      };
    }
    
    // Store tokens
    await storeUserTokens(uid, tokens, businessInfo);
    console.log('✅ Tokens stored in Firestore');
    
    // Track event
    await trackEvent(uid, 'google_connected', {
      businessName: businessInfo.businessName,
      locationId: businessInfo.locationId
    });
    
    console.log(`🎉 Google connection successful for user: ${uid}`);
    
    // Redirect to success
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://reviewpilot.live/connect?connected=true'
      : 'http://localhost:5173/connect?connected=true';
    
    res.redirect(redirectUrl);
    
  } catch (err) {
    console.error('OAuth callback processing error:', err);
    
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://reviewpilot.live/connect?error=connection_failed'
      : 'http://localhost:5173/connect?error=connection_failed';
    
    res.redirect(redirectUrl);
  }
});

export default router;