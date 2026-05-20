import express from 'express';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const router = express.Router();

const VALID_LOCATIONS = ['homepage-banner', 'dashboard-announcement', 'pricing-banner', 'maintenance-notice'];
const VALID_TYPES = ['info', 'success', 'warning', 'error'];

// ─────────────────────────────────────────────
// ADMIN: PUT /api/admin/site-messages/:location
// Create or update a site message/banner
// ─────────────────────────────────────────────
router.put('/:location', verifyFirebaseToken, checkAdmin, async (req, res) => {
  const { location } = req.params;
  const { enabled, message, type, link, linkText, startDate, endDate } = req.body;

  console.log(`📢 [PUT /api/admin/site-messages/${location}]`);

  if (!VALID_LOCATIONS.includes(location)) {
    return res.status(400).json({
      success: false,
      error: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(', ')}`
    });
  }

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  if (message && message.length > 500) {
    return res.status(400).json({ success: false, error: 'Message too long (max 500 characters)' });
  }

  try {
    const messageData = {
      ...(enabled !== undefined && { enabled }),
      ...(message && { message: message.trim() }),
      ...(type && { type }),
      ...(link && { link: link.trim() }),
      ...(linkText && { linkText: linkText.trim() }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      updatedBy: req.email,
      updatedAt: new Date()
    };

    await db
      .collection('config')
      .doc('site-messages')
      .set({ [location]: messageData }, { merge: true });

    console.log(`✅ Site message updated: ${location}`);
    res.json({ success: true, location, message: messageData });

  } catch (err) {
    console.error(`❌ [PUT /api/admin/site-messages/${location}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to update site message' });
  }
});

// ─────────────────────────────────────────────
// ADMIN: GET /api/admin/site-messages
// Get all configured banners
// ─────────────────────────────────────────────
router.get('/', verifyFirebaseToken, checkAdmin, async (req, res) => {
  console.log(`📢 [GET /api/admin/site-messages]`);

  try {
    const doc = await db.collection('config').doc('site-messages').get();

    if (!doc.exists) {
      return res.json({ success: true, messages: {} });
    }

    console.log(`✅ Site messages fetched`);
    res.json({ success: true, messages: doc.data() });

  } catch (err) {
    console.error('❌ [GET /api/admin/site-messages] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch site messages' });
  }
});

// ─────────────────────────────────────────────
// PUBLIC: GET /api/site-messages/:location
// Frontend reads active banners (no auth needed)
// Only returns if enabled and within date range
// ─────────────────────────────────────────────
router.get('/public/:location', async (req, res) => {
  const { location } = req.params;

  try {
    const doc = await db.collection('config').doc('site-messages').get();

    if (!doc.exists) {
      return res.json({ success: true, message: null });
    }

    const messageData = doc.data()?.[location];

    if (!messageData || !messageData.enabled) {
      return res.json({ success: true, message: null });
    }

    // Check date range
    const now = new Date();
    if (messageData.startDate && now < messageData.startDate.toDate()) {
      return res.json({ success: true, message: null });
    }
    if (messageData.endDate && now > messageData.endDate.toDate()) {
      return res.json({ success: true, message: null });
    }

    res.json({ success: true, message: messageData });

  } catch (err) {
    console.error(`❌ [GET /api/site-messages/public/${location}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch site message' });
  }
});

export default router;
