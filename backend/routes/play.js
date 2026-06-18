// backend/routes/play.js
// Google Play Store integration routes
// Covers: OAuth, app management, reviews, replies, sync

import express from 'express';
import axios from 'axios';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { authLimiter, aiLimiter } from '../middleware/rateLimiter.js';
import { sanitizeString } from '../utils/sanitize.js';
import {
  getPlayAuthUrl,
  exchangePlayCode,
  storePlayTokens,
  removePlayTokens
} from '../services/playStoreOAuth.js';
import {
  fetchAndStorePlayReviews,
  postPlayReply,
  validatePackageOwnership
} from '../services/playStoreReviews.js';
import multer from 'multer';
import { parsePlayConsoleCsv } from '../utils/csvParser.js';
import { validateCsvFormat, validateCsvHeaders } from '../utils/csvValidator.js';
import { queueCsvImport } from '../services/csvImportService.js';
import { checkPlanLevel } from '../middleware/checkPlanLevel.js';
import { checkTrialFeature } from '../middleware/trialGate.js';
import { BUSINESS_TYPE_CONTEXT } from '../services/businessProfileService.js';
import Papa from 'papaparse';

const router = express.Router();

// Multer config for CSV upload — memory storage, 10MB limit, csv only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  }
});

// Plans allowed to use CSV import
const CSV_IMPORT_PLANS = ['growth', 'play_growth', 'gbp_growth', 'bundle_growth', 'play_pro', 'gbp_pro', 'bundle_suite', 'pro'];

// ─────────────────────────────────────────────
// PL-03: OAuth — Initiate Play Console connection
// GET /api/play/auth/google
// ─────────────────────────────────────────────
router.get('/auth/google', authLimiter, verifyFirebaseToken, (req, res) => {
  const uid = req.uid;
  const origin = req.headers.origin || req.headers.referer || 'https://reviewpilot.live';
  const originDomain = origin.replace(/\/$/, '').split('/').slice(0, 3).join('/');

  console.log(`🎮 [GET /api/play/auth/google] User: ${uid}, Origin: ${originDomain}`);

  try {
    const authUrl = getPlayAuthUrl(uid, originDomain);
    res.json({ url: authUrl });
  } catch (err) {
    console.error('❌ [play/auth/google] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate Play auth URL' });
  }
});

// ─────────────────────────────────────────────
// PL-03: OAuth — Callback after Google approval
// GET /api/play/auth/callback
// ─────────────────────────────────────────────
router.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Decode state to get uid + origin
  let uid, origin;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    uid = decoded.uid;
    origin = decoded.origin || 'https://reviewpilot.live';
  } catch {
    uid = state;
    origin = 'https://reviewpilot.live';
  }

  console.log(`🎮 [GET /api/play/auth/callback] uid: ${uid}, origin: ${origin}`);

  if (error) {
    console.error('OAuth error from Google:', error);
    return res.redirect(`${origin}/settings?play=error&reason=auth_denied`);
  }

  if (!code || !uid) {
    return res.redirect(`${origin}/settings?play=error&reason=missing_params`);
  }

  try {
    const tokens = await exchangePlayCode(code);
    await storePlayTokens(uid, tokens);
    await trackEvent(uid, 'platform_connected', { platform: 'play' });

    console.log(`✅ [Play OAuth] Tokens stored for user: ${uid}`);
    res.redirect(`${origin}/settings?play=connected`);

  } catch (err) {
    console.error('❌ [play/auth/callback] Error:', err.message);
    res.redirect(`${origin}/settings?play=error&reason=connection_failed`);
  }
});

// ─────────────────────────────────────────────
// GET /api/play/status
// Connection status + connected apps list
// ─────────────────────────────────────────────
router.get('/status', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const playAuth = userDoc.data()?.playAuth;

    if (!playAuth?.connected) {
      return res.json({ success: true, connected: false, apps: [] });
    }

    const appsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('playApps')
      .get();

    const apps = appsSnapshot.docs.map(doc => doc.data());

    res.json({
      success: true,
      connected: true,
      connectedAt: playAuth.connectedAt,
      apps
    });

  } catch (err) {
    console.error('❌ [play/status] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch Play status' });
  }
});

// ─────────────────────────────────────────────
// POST /api/play/auth/disconnect
// Remove Play Console connection
// ─────────────────────────────────────────────
router.post('/auth/disconnect', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`🎮 [POST /api/play/auth/disconnect] User: ${uid}`);

  try {
    await removePlayTokens(uid);
    await trackEvent(uid, 'platform_disconnected', { platform: 'play' });
    console.log(`✅ Play Console disconnected for user: ${uid}`);
    res.json({ success: true, message: 'Play Console disconnected' });
  } catch (err) {
    console.error('❌ [play/auth/disconnect] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

// ─────────────────────────────────────────────
// PL-04: App Management
// GET /api/play/apps — list connected apps
// ─────────────────────────────────────────────
router.get('/apps', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;

  try {
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('playApps')
      .get();

    const apps = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, apps });
  } catch (err) {
    console.error('❌ [play/apps GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch apps' });
  }
});

// ─────────────────────────────────────────────
// POST /api/play/apps — add new app by package name
// ─────────────────────────────────────────────
router.post('/apps', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { packageName, appName } = req.body;

  console.log(`🎮 [POST /api/play/apps] User: ${uid}, Package: ${packageName}`);

  // Validate package name format
  if (!packageName || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid package name. Must be like: com.example.myapp'
    });
  }

  const sanitizedAppName = sanitizeString(appName || packageName, 100);

  try {
    // Check if already added
    const existing = await db
      .collection('users')
      .doc(uid)
      .collection('playApps')
      .doc(packageName)
      .get();

    if (existing.exists) {
      return res.status(409).json({ success: false, error: 'App already connected' });
    }

    // Validate package exists in Play Store by attempting a review fetch
    // If it fails, package doesn't exist or user doesn't have access
    try {
      await fetchAndStorePlayReviews(uid, packageName);
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          error: `Package '${packageName}' not found. Make sure you have access in Play Console.`
        });
      }
      // Other errors (quota etc.) — still save the app
      console.warn(`[play/apps] Review fetch failed but saving app anyway: ${err.message}`);
    }

    const appData = {
      packageName,
      appName: sanitizedAppName,
      addedAt: new Date(),
      lastSyncAt: new Date()
    };

    await db
      .collection('users')
      .doc(uid)
      .collection('playApps')
      .doc(packageName)
      .set(appData);

    console.log(`✅ App added: ${packageName} for user: ${uid}`);
    await trackEvent(uid, 'app_added', { packageName, platform: 'play' });
    res.status(201).json({ success: true, app: appData });

  } catch (err) {
    console.error('❌ [play/apps POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to add app' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/play/apps/:packageName — remove app
// ─────────────────────────────────────────────
router.delete('/apps/:packageName', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { packageName } = req.params;

  console.log(`🎮 [DELETE /api/play/apps/${packageName}] User: ${uid}`);

  try {
    await db
      .collection('users')
      .doc(uid)
      .collection('playApps')
      .doc(packageName)
      .delete();

    console.log(`✅ App removed: ${packageName} for user: ${uid}`);
    res.json({ success: true, message: `App ${packageName} removed` });
  } catch (err) {
    console.error('❌ [play/apps DELETE] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove app' });
  }
});

// ─────────────────────────────────────────────
// PL-05: GET /api/play/reviews
// Fetch stored reviews — supports filtering
// ─────────────────────────────────────────────
router.get('/reviews', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { packageName, rating, status, page = 1, limit = 20 } = req.query;

  console.log(`🎮 [GET /api/play/reviews] User: ${uid}, Package: ${packageName || 'all'}`);

  try {
    let query = db.collection('playReviews').where('userId', '==', uid);

    if (packageName) {
      query = query.where('packageName', '==', packageName);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('lastModified', 'desc').get();
    let reviews = snapshot.docs.map(doc => doc.data());

    // Filter by rating if provided (comma-separated: "1,2")
    if (rating) {
      const ratings = rating.split(',').map(Number);
      reviews = reviews.filter(r => ratings.includes(r.starRating));
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = reviews.length;
    const paginated = reviews.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      reviews: paginated,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });

  } catch (err) {
    console.error('❌ [play/reviews] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// ─────────────────────────────────────────────
// GET /api/play/reviews/:reviewId — single review
// ─────────────────────────────────────────────
router.get('/reviews/:reviewId', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { reviewId } = req.params;
  const { packageName } = req.query;

  if (!packageName) {
    return res.status(400).json({ success: false, error: 'packageName query param required' });
  }

  try {
    const docId = `${uid}_${packageName}_${reviewId}`;
    const doc = await db.collection('playReviews').doc(docId).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, review: doc.data() });

  } catch (err) {
    console.error('❌ [play/reviews/:reviewId] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch review' });
  }
});

// ─────────────────────────────────────────────
// PL-06 + PL-08: POST /api/play/reviews/:reviewId/reply
// Generate AI reply and/or post reply to Play Store
// ─────────────────────────────────────────────
router.post('/reviews/:reviewId/reply', verifyFirebaseToken, aiLimiter, async (req, res) => {
  const uid = req.uid;
  const { reviewId } = req.params;
  const { packageName, replyText, generateAI } = req.body;

  console.log(`🎮 [POST /api/play/reviews/${reviewId}/reply] User: ${uid}, Package: ${packageName}`);

  if (!packageName) {
    return res.status(400).json({ success: false, error: 'packageName is required' });
  }

  // Verify user owns this app
  const isOwner = await validatePackageOwnership(uid, packageName);
  if (!isOwner) {
    return res.status(403).json({ success: false, error: 'App not connected to your account' });
  }

  try {
    let finalReply = replyText;

    // Generate AI reply if requested or no reply provided
    if (generateAI || !finalReply) {
      const docId = `${uid}_${packageName}_${reviewId}`;
      const reviewDoc = await db.collection('playReviews').doc(docId).get();

      if (!reviewDoc.exists) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      const review = reviewDoc.data();

      // Fetch user settings for tone/instructions
      const settingsDoc = await db
        .collection('users')
        .doc(uid)
        .collection('settings')
        .doc('preferences')
        .get();
      const settings = settingsDoc.data() || {};

      // Build app context for context-aware replies (Section 13.7)
      const appDocRef = await db.collection('users').doc(uid).collection('playApps').doc(packageName).get();
      const appData = appDocRef.exists ? appDocRef.data() : null;
      const appContext = appData ? {
        appName: appData.appName || packageName,
        packageName,
        currentVersion: review.appVersion
      } : null;

      finalReply = await generatePlayReplyWithAI(review, settings, appContext);

      // Save as draft if just generating
      if (generateAI && !replyText) {
        await db.collection('playReviews').doc(docId).set({
          aiReply: finalReply,
          status: 'draft_ready'
        }, { merge: true });

        return res.json({ success: true, aiReply: finalReply, status: 'draft_ready' });
      }
    }

    // Validate reply length (Play Store 350 char limit)
    if (finalReply.length > 350) {
      return res.status(400).json({
        success: false,
        error: `Reply exceeds 350 character limit (${finalReply.length} chars)`
      });
    }

    // Post to Play Store
    // TODO: Remove try/catch swallowing once Play API quota confirmed working
    try {
      await postPlayReply(uid, packageName, reviewId, finalReply);
    } catch (err) {
      console.warn(`⚠️ [TEMP] Play API post failed, saving locally only: ${err.message}`);
    }

    res.json({ success: true, reply: finalReply, status: 'replied' });

  } catch (err) {
    console.error(`❌ [play/reviews/${reviewId}/reply] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to post reply' });
  }
});

// ─────────────────────────────────────────────
// PL-07: POST /api/play/sync — manual sync trigger
// ─────────────────────────────────────────────
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { packageName } = req.body;

  console.log(`🔄 [POST /api/play/sync] User: ${uid}, Package: ${packageName || 'all'}`);

  try {
    const appsSnapshot = packageName
      ? await db.collection('users').doc(uid).collection('playApps').doc(packageName).get().then(d => d.exists ? [d] : [])
      : await db.collection('users').doc(uid).collection('playApps').get().then(s => s.docs);

    if (appsSnapshot.length === 0) {
      return res.status(400).json({ success: false, error: 'No apps connected. Add an app first.' });
    }

    let totalSynced = 0;
    const results = [];

    for (const appDoc of appsSnapshot) {
      const pkg = appDoc.data().packageName;
      try {
        const count = await fetchAndStorePlayReviews(uid, pkg);
        totalSynced += count;
        results.push({ packageName: pkg, synced: count, success: true });
      } catch (err) {
        console.error(`[Play Sync] Failed for ${pkg}:`, err.message);
        results.push({ packageName: pkg, success: false, error: err.message });
      }
    }

    console.log(`✅ [Play Sync] Total synced: ${totalSynced} reviews`);
    res.json({ success: true, totalSynced, results });

  } catch (err) {
    console.error('❌ [play/sync] Error:', err.message);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// ─────────────────────────────────────────────
// PL-08: AI reply generation for Play Store reviews
// 300 char target (350 hard limit with buffer)
// ─────────────────────────────────────────────
async function generatePlayReplyWithAI(review, settings, appContext = null) {
  // Section 13.7 — App context for Play Store replies
  const appContextStr = appContext
    ? `You are the developer of ${appContext.appName} (${appContext.packageName}).
The reviewer is using version ${appContext.currentVersion || review.appVersion || 'Unknown'}.
App context: ${BUSINESS_TYPE_CONTEXT['app_developer']}
`
    : `You are responding to a Google Play Store app review on behalf of the app developer.
`;

  const prompt = `${appContextStr}
App Review:
Rating: ${review.starRating}/5 stars
Review: "${review.text}"
Device: ${review.device || 'Unknown'}
App Version: ${review.appVersion || 'Unknown'}

Developer's tone preference: ${settings.tone || 'professional'}
Custom instructions: ${settings.customInstructions || 'None'}

CRITICAL RULES:
1. Reply must be MAXIMUM 300 characters (hard limit — leave buffer for Play Store's 350 limit)
2. Be genuine and helpful
3. For negative reviews: acknowledge the issue, offer solution or next steps
4. For positive reviews: thank the user warmly
5. Do NOT mention competitor apps
6. Do NOT make promises you cannot keep
7. End with a call-to-action if appropriate (e.g., "Update to fix this!")
${appContext ? '8. Reference the app name naturally if appropriate' : ''}

Respond with ONLY the reply text. No quotes, no explanation.`;

  let reply = '';
  let lastError;

  // Retry up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      reply = response.data.content[0].text.trim();
      break;

    } catch (err) {
      lastError = err;
      console.warn(`[Play AI] Attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  if (!reply) throw lastError;

  // Truncate at word boundary if over 350
  if (reply.length > 350) {
    reply = reply.substring(0, 347) + '...';
  }

  return reply;
}

// ─────────────────────────────────────────────
// CSV-01: POST /api/play/import-csv
// Upload Play Console review export — Growth/Pro only
// ─────────────────────────────────────────────
router.post('/import-csv',
  verifyFirebaseToken,
  checkPlanLevel(CSV_IMPORT_PLANS),
  checkTrialFeature('csvImport'),
  upload.single('reviewsCsv'),
  async (req, res) => {
    const uid = req.uid;
    const { packageName } = req.body;

    console.log(`📂 [POST /api/play/import-csv] User: ${uid}, Package: ${packageName}`);

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!packageName) {
      return res.status(400).json({ success: false, error: 'packageName is required' });
    }

    try {
      // Verify user owns this app
      const isOwner = await validatePackageOwnership(uid, packageName);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'App not connected to your account' });
      }

      // Quick header check before full parse — catches obviously wrong files fast
      const csvString = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
      const headerLine = csvString.split('\n')[0];
      const rawHeaders = Papa.parse(headerLine).data[0] || [];
      const headerCheck = validateCsvHeaders(rawHeaders);

      if (!headerCheck.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CSV_FORMAT',
          message: headerCheck.message
        });
      }

      const reviews = await parsePlayConsoleCsv(req.file.buffer);

      const validation = validateCsvFormat(reviews);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CSV_FORMAT',
          message: validation.message
        });
      }

      // Package name mismatch check
      const csvPackageName = reviews[0]?.packageName;
      if (csvPackageName !== packageName) {
        return res.status(400).json({
          success: false,
          error: 'PACKAGE_NAME_MISMATCH',
          message: `CSV is for ${csvPackageName} but you selected ${packageName}`
        });
      }

      // Plan-based import limit — Pro = unlimited, Growth = 1000
      const isPro = ['play_pro', 'gbp_pro', 'pro', 'bundle_suite'].includes(req.planKey);
      const importLimit = isPro ? Infinity : 1000;

      const reviewsToImport = reviews.slice(0, importLimit);
      const truncated = reviews.length > importLimit;

      const jobId = await queueCsvImport(uid, packageName, reviewsToImport);

      console.log(`✅ [import-csv] Job queued: ${jobId} — ${reviewsToImport.length}/${reviews.length} reviews`);

      res.json({
        success: true,
        jobId,
        totalInFile: reviews.length,
        toImport: reviewsToImport.length,
        truncated,
        message: truncated
          ? `Growth plan limit: importing first 1,000 of ${reviews.length} reviews. Upgrade to Pro for unlimited.`
          : `Importing ${reviewsToImport.length} reviews...`
      });

    } catch (err) {
      console.error('❌ [import-csv] Error:', err.message);
      res.status(500).json({ success: false, error: err.message || 'Failed to process CSV' });
    }
  }
);

// ─────────────────────────────────────────────
// CSV-05: GET /api/play/import-status/:jobId
// Poll import job progress
// ─────────────────────────────────────────────
router.get('/import-status/:jobId', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { jobId } = req.params;

  try {
    const jobDoc = await db.collection('importJobs').doc(jobId).get();

    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const data = jobDoc.data();

    if (data.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const progress = data.totalReviews > 0
      ? Math.round((data.processedReviews / data.totalReviews) * 100)
      : 0;

    res.json({
      success: true,
      status: data.status, // processing | completed | failed
      progress,
      totalReviews: data.totalReviews,
      importedReviews: data.importedReviews,
      skippedReviews: data.skippedReviews,
      completedAt: data.completedAt,
      error: data.error
    });

  } catch (err) {
    console.error('❌ [import-status] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch import status' });
  }
});

// ─────────────────────────────────────────────
// CSV-07: GET /api/play/import-history
// Last 10 import jobs for this user
// ─────────────────────────────────────────────
router.get('/import-history', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;

  try {
    const snapshot = await db.collection('importJobs')
      .where('userId', '==', uid)
      .orderBy('startedAt', 'desc')
      .limit(10)
      .get();

    const imports = snapshot.docs.map(doc => ({
      jobId: doc.id,
      packageName: doc.data().packageName,
      status: doc.data().status,
      importedReviews: doc.data().importedReviews,
      skippedReviews: doc.data().skippedReviews,
      startedAt: doc.data().startedAt,
      completedAt: doc.data().completedAt
    }));

    res.json({ success: true, imports });

  } catch (err) {
    console.error('❌ [import-history] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch import history' });
  }
});

export default router;