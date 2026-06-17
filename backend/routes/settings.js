import express from 'express';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { sanitizeSettingsInput } from '../utils/sanitize.js';

const router = express.Router();

function getDefaultSettings() {
  return {
    replyMode: 'manual',
    tone: 'professional',
    businessName: '',
    replyToRatingOnly: false,
    customInstructions: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// GET /api/settings
router.get('/', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`⚙️ [GET /api/settings] User: ${uid}`);

  try {
    const [settingsDoc, userDoc] = await Promise.all([
      db.collection('users').doc(uid).collection('settings').doc('preferences').get(),
      db.collection('users').doc(uid).get()
    ]);

    const userData = userDoc.data() || {};
    console.log(`⚙️ [GET /api/settings] userData keys:`, Object.keys(userData));
    console.log(`⚙️ [GET /api/settings] google field:`, userData.google);
    console.log(`⚙️ [GET /api/settings] settings field:`, userData.settings);
    // google.connected is set by OAuth callback
    // businessName stored by storeUserTokens as dotted 'settings.businessName' -> nested field
    // Also check top-level googleBusinessName as fallback
    const isConnected = userData.google?.connected === true ||
      (userData.googleAccountId && userData.googleAccountId !== 'pending-verification');

    // storeUserTokens uses set({ 'settings.businessName': value }) which Firestore
    // stores as nested settings.businessName — read via userData.settings?.businessName
    const businessName = userData.settings?.businessName
      || userData.googleBusinessName
      || userData.businessName
      || null;

    const google = {
      connected: isConnected,
      businessName,
      email: userData.google?.email || userData.googleEmail || null
    };

    if (!settingsDoc.exists) {
      console.log(`⚙️ [GET /api/settings] No settings found, returning defaults`);
      return res.json({ success: true, settings: getDefaultSettings(), google });
    }

    console.log(`⚙️ [GET /api/settings] Settings found`);
    res.json({ success: true, settings: settingsDoc.data(), google });

  } catch (err) {
    console.error(`❌ [GET /api/settings] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`⚙️ [PUT /api/settings] User: ${uid}`, req.body);

  // Sanitize inputs before processing
  const sanitizedBody = sanitizeSettingsInput(req.body);

  const allowedFields = [
    'replyMode', 'tone', 'businessName',
    'replyToRatingOnly', 'customInstructions'
  ];

  // Whitelist fields
  const updates = {};
  for (const field of allowedFields) {
    if (sanitizedBody[field] !== undefined) {
      updates[field] = sanitizedBody[field];
    }
  }

  // Validate replyMode
  if (updates.replyMode && !['auto', 'semi-auto', 'manual'].includes(updates.replyMode)) {
    return res.status(400).json({ success: false, error: 'Invalid replyMode. Must be: auto, semi-auto, or manual' });
  }

  // Validate tone
  if (updates.tone && !['professional', 'friendly', 'casual'].includes(updates.tone)) {
    return res.status(400).json({ success: false, error: 'Invalid tone. Must be: professional, friendly, or casual' });
  }

  // Validate replyToRatingOnly is boolean
  if (updates.replyToRatingOnly !== undefined && typeof updates.replyToRatingOnly !== 'boolean') {
    return res.status(400).json({ success: false, error: 'replyToRatingOnly must be a boolean' });
  }


  try {
    updates.updatedAt = new Date().toISOString();

    await db
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('preferences')
      .set(updates, { merge: true });

    console.log(`✅ [PUT /api/settings] Settings updated for user: ${uid}`);
    res.json({ success: true, settings: updates });

  } catch (err) {
    console.error(`❌ [PUT /api/settings] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

export default router;