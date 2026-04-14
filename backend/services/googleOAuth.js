// backend/services/googleOAuth.js
import { google } from 'googleapis';
import { db } from '../firebaseAdmin.js';
import { encrypt, decrypt } from '../utils/crypto.js';

// Don't initialize OAuth2 client immediately
let oauth2Client = null;

/**
 * Get or create OAuth2 client (lazy initialization)
 */
function getOAuth2Client() {
  if (!oauth2Client) {
    console.log('🔧 Initializing OAuth2 client...');
    console.log('🔑 CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('🔑 REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured in .env');
    }
    
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    console.log('✅ OAuth2 client initialized');
  }
  
  return oauth2Client;
}

/**
 * Generate OAuth authorization URL for user to grant access
 */
// Change this function signature and state encoding
export function getAuthUrl(uid, origin) {
  console.log('🔧 getAuthUrl called for user:', uid, 'origin:', origin);
  
  try {
    const client = getOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/business.manage'
    ];

    // Encode uid + origin together in state
    const state = Buffer.from(JSON.stringify({ uid, origin })).toString('base64');
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent'
    });
    
    console.log('✅ Auth URL generated');
    
    return authUrl;
  } catch (err) {
    console.error('❌ Error in getAuthUrl:', err);
    throw err;
  }
}

/**
 * Exchange authorization code for access + refresh tokens
 */
export async function exchangeCodeForTokens(code) {
  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received');
    }
    
    return tokens;
    
  } catch (err) {
    console.error('Token exchange error:', err);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Get user's Google Business accounts and locations
 */
export async function getUserBusinessLocations(tokens) {
  try {
    const client = getOAuth2Client();
    client.setCredentials(tokens);
    
    const mybusiness = google.mybusinessaccountmanagement({ 
      version: 'v1', 
      auth: client 
    });
    
    // Get accounts
    // Get accounts
console.log('🔍 Fetching Google Business accounts...');
const accountsResponse = await mybusiness.accounts.list();
console.log('📦 Raw response:', JSON.stringify(accountsResponse.data, null, 2));

const accounts = accountsResponse.data.accounts || [];

console.log('📊 Number of accounts found:', accounts.length);

if (accounts.length === 0) {
  console.error('❌ No Google Business accounts found!');
  console.log('💡 Make sure you created a Google Business Profile at https://business.google.com');
  console.log('💡 It can take a few minutes to appear in the API');
  throw new Error('No Google Business accounts found. Please create a Google Business Profile first.');
}

console.log('✅ Accounts found:', accounts.map(a => a.name));
    
    const accountName = accounts[0].name;
    const accountId = accountName.split('/')[1];
    
    console.log(`✅ Found account: ${accountName}`);
    
    // Get locations
    const locationsResponse = await mybusiness.accounts.locations.list({
      parent: accountName,
      readMask: 'name,title,storefrontAddress'
    });
    
    const locations = locationsResponse.data.locations || [];
    
    if (locations.length === 0) {
      throw new Error('No business locations found');
    }
    
    const location = locations[0];
    const locationId = location.name.split('/')[3];
    
    console.log(`✅ Found location: ${location.title}`);
    
    return {
      accountId,
      locationId,
      businessName: location.title || 'Your Business',
      businessAddress: formatAddress(location.storefrontAddress)
    };
    
  } catch (err) {
    console.error('Get business locations error:', err);
    throw new Error('Failed to fetch Google Business Profile information');
  }
}

/**
 * Store encrypted OAuth tokens in Firestore
 */
export async function storeUserTokens(uid, tokens, businessInfo) {
  try {
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    
    await db.collection('users').doc(uid).update({
      googleRefreshToken: encryptedRefreshToken,
      googleAccountId: businessInfo.accountId,
      googleLocationId: businessInfo.locationId,
      'settings.businessName': businessInfo.businessName,
      businessAddress: businessInfo.businessAddress,
      googleConnectedAt: new Date(),
      lastSyncAt: null
    });
    
    console.log(`✅ Stored tokens for user: ${uid}`);
    
  } catch (err) {
    console.error('Store tokens error:', err);
    throw new Error('Failed to save Google connection');
  }
}

/**
 * Get fresh access token using stored refresh token
 */
export async function getAccessToken(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const encryptedRefreshToken = userData.googleRefreshToken;
    
    if (!encryptedRefreshToken) {
      throw new Error('Google account not connected');
    }
    
    const refreshToken = decrypt(encryptedRefreshToken);
    
    const client = getOAuth2Client();
    client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await client.refreshAccessToken();
    
    return credentials.access_token;
    
  } catch (err) {
    console.error('Get access token error:', err);
    throw new Error('Failed to get Google access token');
  }
}

/**
 * Get authenticated OAuth2 client for a user
 */
export async function getAuthenticatedClient(uid) {
  const accessToken = await getAccessToken(uid);
  
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  client.setCredentials({
    access_token: accessToken
  });
  
  return client;
}

/**
 * Helper: Format address
 */
function formatAddress(address) {
  if (!address) return 'Address not available';
  
  const parts = [
    address.addressLines?.join(', '),
    address.locality,
    address.administrativeArea,
    address.postalCode,
    address.regionCode
  ].filter(Boolean);
  
  return parts.join(', ') || 'Address not available';
}