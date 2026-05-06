import express from 'express';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

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

function sanitizeInput(input) {
  return input.replace(/<[^>]*>/g, '').trim();
}

// GET /api/settings
router.get('/', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`⚙️ [GET /api/settings] User: ${uid}`);

  try {
    const settingsDoc = await db
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('preferences')
      .get();

    if (!settingsDoc.exists) {
      console.log(`⚙️ [GET /api/settings] No settings found, returning defaults`);
      return res.json({ success: true, settings: getDefaultSettings() });
    }

    console.log(`⚙️ [GET /api/settings] Settings found`);
    res.json({ success: true, settings: settingsDoc.data() });

  } catch (err) {
    console.error(`❌ [GET /api/settings] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`⚙️ [PUT /api/settings] User: ${uid}`, req.body);

  const allowedFields = [
    'replyMode', 'tone', 'businessName',
    'replyToRatingOnly', 'customInstructions'
  ];

  // Whitelist fields
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
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

  // Sanitize string inputs
  if (updates.businessName) updates.businessName = sanitizeInput(updates.businessName);
  if (updates.customInstructions) updates.customInstructions = sanitizeInput(updates.customInstructions);

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