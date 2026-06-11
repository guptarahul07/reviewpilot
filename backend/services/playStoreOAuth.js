// backend/services/playStoreOAuth.js
// OAuth and token management for Google Play Developer API
// Separate from GBP OAuth — uses androidpublisher scope

import { google } from 'googleapis';
import { encrypt, decrypt } from '../utils/crypto.js';
import { db } from '../firebaseAdmin.js';

const PLAY_SCOPES = ['https://www.googleapis.com/auth/androidpublisher'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.PLAY_REDIRECT_URI || `${process.env.BASE_URL || 'https://reviewpilot-production-90c5.up.railway.app'}/api/play/auth/callback`
  );
}

// Generate OAuth URL for Play Console connection
export function getPlayAuthUrl(uid, origin) {
  const client = getOAuth2Client();
  const state = Buffer.from(JSON.stringify({ uid, origin })).toString('base64');

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: PLAY_SCOPES,
    state,
    prompt: 'consent'
  });
}

// Exchange code for tokens
export async function exchangePlayCode(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Store encrypted Play tokens in Firestore
export async function storePlayTokens(uid, tokens) {
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  await db.collection('users').doc(uid).set({
    playAuth: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      connectedAt: new Date(),
      connected: true
    }
  }, { merge: true });
}

// Get valid access token — refresh if expiring within 5 minutes
export async function getValidPlayToken(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const playAuth = userDoc.data()?.playAuth;

  if (!playAuth?.refreshToken) {
    throw new Error('Play Console not connected');
  }

  const expiresAt = playAuth.expiresAt?.toDate
    ? playAuth.expiresAt.toDate()
    : new Date(playAuth.expiresAt);

  const fiveMinutes = 5 * 60 * 1000;
  if (expiresAt.getTime() < Date.now() + fiveMinutes) {
    console.log(`[PlayAuth] Refreshing token for user: ${uid}`);
    return await refreshPlayToken(uid, decrypt(playAuth.refreshToken));
  }

  return decrypt(playAuth.accessToken);
}

// Refresh access token using refresh token
async function refreshPlayToken(uid, refreshToken) {
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  const encryptedAccessToken = encrypt(credentials.access_token);
  await db.collection('users').doc(uid).set({
    playAuth: {
      accessToken: encryptedAccessToken,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000)
    }
  }, { merge: true });

  console.log(`[PlayAuth] Token refreshed for user: ${uid}`);
  return credentials.access_token;
}

// Remove Play tokens from Firestore
export async function removePlayTokens(uid) {
  await db.collection('users').doc(uid).set({
    playAuth: {
      connected: false,
      disconnectedAt: new Date(),
      accessToken: null,
      refreshToken: null
    }
  }, { merge: true });
}
