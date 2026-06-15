// backend/cron/tokenHealthCheck.js
// Daily token health check — validates OAuth tokens for all connected users
// If token refresh fails → mark as disconnected + send email

import cron from 'node-cron';
import { db } from '../firebaseAdmin.js';
import { getAuthenticatedClient } from '../services/googleOAuth.js';
import { getValidPlayToken } from '../services/playStoreOAuth.js';
import { sendTokenExpiredEmail } from '../services/emailService.js';

// ─────────────────────────────────────────────
// Validate GBP token by attempting a refresh
// ─────────────────────────────────────────────
async function validateGBPToken(uid) {
  try {
    await getAuthenticatedClient(uid);
    return true;
  } catch (err) {
    console.warn(`[TokenHealth] GBP token invalid for user ${uid}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// Validate Play token by attempting a refresh
// ─────────────────────────────────────────────
async function validatePlayToken(uid) {
  try {
    await getValidPlayToken(uid);
    return true;
  } catch (err) {
    console.warn(`[TokenHealth] Play token invalid for user ${uid}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// Mark platform as disconnected in Firestore
// ─────────────────────────────────────────────
async function markPlatformDisconnected(uid, platform) {
  if (platform === 'gbp') {
    await db.collection('users').doc(uid).set({
      'google.connected': false,
      'google.disconnectedAt': new Date(),
      'google.disconnectedReason': 'token_expired'
    }, { merge: true });
  } else if (platform === 'play') {
    await db.collection('users').doc(uid).set({
      'playAuth.connected': false,
      'playAuth.disconnectedAt': new Date(),
      'playAuth.disconnectedReason': 'token_expired'
    }, { merge: true });
  }
}

// ─────────────────────────────────────────────
// Main health check job
// ─────────────────────────────────────────────
async function runTokenHealthCheck() {
  console.log('[TokenHealth] Starting daily token health check...');

  try {
    const usersSnapshot = await db.collection('users').get();

    let gbpChecked = 0, gbpFailed = 0;
    let playChecked = 0, playFailed = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const email = userData.email;

      if (!email) continue;

      const name = userData.profile?.displayName || userData.displayName || 'there';
      const gbpConnected = userData.google?.connected === true;
      const playConnected = userData.playAuth?.connected === true;

      // Check GBP token
      if (gbpConnected) {
        gbpChecked++;
        const valid = await validateGBPToken(uid);

        if (!valid) {
          gbpFailed++;
          await markPlatformDisconnected(uid, 'gbp');
          await sendTokenExpiredEmail({ to: email, name, platform: 'gbp' });
          console.log(`[TokenHealth] GBP disconnected + email sent for user: ${uid}`);
        }
      }

      // Check Play token
      if (playConnected) {
        playChecked++;
        const valid = await validatePlayToken(uid);

        if (!valid) {
          playFailed++;
          await markPlatformDisconnected(uid, 'play');
          await sendTokenExpiredEmail({ to: email, name, platform: 'play' });
          console.log(`[TokenHealth] Play disconnected + email sent for user: ${uid}`);
        }
      }

      // Delay between users to avoid hammering Google APIs
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[TokenHealth] Done — GBP: ${gbpChecked} checked, ${gbpFailed} failed | Play: ${playChecked} checked, ${playFailed} failed`);

  } catch (err) {
    console.error('[TokenHealth] Error:', err.message);
  }
}

// 3AM IST = 21:30 UTC (runs before review sync at 2AM IST)
// Actually: 1AM IST = 19:30 UTC — run before the 2AM sync
cron.schedule('30 19 * * *', runTokenHealthCheck, { timezone: 'UTC' });

console.log('[TokenHealth] Scheduled — runs daily at 1:00 AM IST');

export { runTokenHealthCheck };
