// backend/services/googleReviews.js
//
// Service to fetch and post reviews via Google My Business API
// Uses authenticated OAuth2 client with user's refresh token

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleOAuth.js';
import { db } from '../firebaseAdmin.js';

/**
 * Fetch reviews from Google My Business
 * @param {string} uid - Firebase user ID
 * @returns {Promise<Array>} Array of formatted reviews
 */
export async function fetchGoogleReviews(uid) {
  try {
    console.log('📥 Fetching reviews for user:', uid);
    
    // Get authenticated client
    const authClient = await getAuthenticatedClient(uid);
    
    // Get user's account and location IDs from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found in database');
    }
    
    const userData = userDoc.data();
    const { googleAccountId, googleLocationId } = userData;
    
    if (!googleAccountId || !googleLocationId) {
      throw new Error('Google Business Profile not connected');
    }
    
    console.log(`📍 Account: ${googleAccountId}, Location: ${googleLocationId}`);
    
    // Initialize My Business Business Information API
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: authClient
    });
    
    // Fetch reviews
    console.log('🔍 Calling Google My Business API...');
    
    const response = await mybusinessbusinessinformation.accounts.locations.reviews.list({
      parent: `accounts/${googleAccountId}/locations/${googleLocationId}`
    });
    
    const reviews = response.data.reviews || [];
    
    console.log(`✅ Found ${reviews.length} reviews`);
    
    // Parse and format reviews
    const formattedReviews = reviews.map(review => parseGoogleReview(review));
    
    return formattedReviews;
    
  } catch (err) {
    console.error('❌ Fetch Google reviews error:', err);
    
    // Better error messages
    if (err.message.includes('invalid_grant')) {
      throw new Error('Google authorization expired. Please reconnect your Google account.');
    }
    
    if (err.message.includes('403')) {
      throw new Error('Insufficient permissions. Make sure you granted all required permissions.');
    }
    
    if (err.message.includes('404')) {
      throw new Error('Business location not found. Your business might still be pending verification.');
    }
    
    throw new Error(`Failed to fetch reviews: ${err.message}`);
  }
}

/**
 * Parse Google review object into our format
 * @param {Object} review - Raw Google review object
 * @returns {Object} Formatted review
 */
function parseGoogleReview(review) {
  // Extract review ID from the name field
  // Format: "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
  const reviewId = review.name.split('/').pop();
  
  return {
    id: reviewId,
    reviewer: review.reviewer?.displayName || 'Anonymous',
    profilePhotoUrl: review.reviewer?.profilePhotoUrl || null,
    rating: mapStarRating(review.starRating),
    text: review.comment || '',
    createTime: review.createTime,
    updateTime: review.updateTime,
    hasReply: !!review.reviewReply,
    existingReply: review.reviewReply?.comment || null,
    replyTime: review.reviewReply?.updateTime || null
  };
}

/**
 * Map Google's star rating enum to number
 * Google uses: STAR_RATING_UNSPECIFIED, ONE, TWO, THREE, FOUR, FIVE
 * @param {string} starRating - Google's star rating enum
 * @returns {number} Star rating as number (1-5)
 */
function mapStarRating(starRating) {
  const map = {
    'STAR_RATING_UNSPECIFIED': 0,
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  };
  
  return map[starRating] || 0;
}

/**
 * Post reply to a Google review
 * @param {string} uid - Firebase user ID
 * @param {string} reviewId - Google review ID
 * @param {string} replyText - Reply text to post
 * @returns {Promise<Object>} Success indicator
 */
export async function postReplyToGoogle(uid, reviewId, replyText) {
  try {
    console.log('📤 Posting reply to review:', reviewId);
    
    // Validate inputs
    if (!replyText || replyText.trim().length === 0) {
      throw new Error('Reply text cannot be empty');
    }
    
    if (replyText.length > 4096) {
      throw new Error('Reply text too long (max 4096 characters)');
    }
    
    // Get authenticated client
    const authClient = await getAuthenticatedClient(uid);
    
    // Get user's account and location IDs
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const { googleAccountId, googleLocationId } = userData;
    
    // Initialize API
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: authClient
    });
    
    // Post reply
    console.log('🔍 Calling Google API to post reply...');
    
    await mybusinessbusinessinformation.accounts.locations.reviews.updateReply({
      name: `accounts/${googleAccountId}/locations/${googleLocationId}/reviews/${reviewId}/reply`,
      requestBody: {
        comment: replyText.trim()
      }
    });
    
    console.log('✅ Reply posted successfully');
    
    return { success: true };
    
  } catch (err) {
    console.error('❌ Post reply error:', err);
    
    // Better error messages
    if (err.message.includes('invalid_grant')) {
      throw new Error('Google authorization expired. Please reconnect your Google account.');
    }
    
    if (err.message.includes('403')) {
      throw new Error('Insufficient permissions to post replies.');
    }
    
    if (err.message.includes('404')) {
      throw new Error('Review not found or has been deleted.');
    }
    
    throw new Error(`Failed to post reply: ${err.message}`);
  }
}

/**
 * Delete a reply from a Google review
 * @param {string} uid - Firebase user ID
 * @param {string} reviewId - Google review ID
 * @returns {Promise<Object>} Success indicator
 */
export async function deleteReplyFromGoogle(uid, reviewId) {
  try {
    console.log('🗑️ Deleting reply from review:', reviewId);
    
    // Get authenticated client
    const authClient = await getAuthenticatedClient(uid);
    
    // Get user's account and location IDs
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const { googleAccountId, googleLocationId } = userData;
    
    // Initialize API
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: authClient
    });
    
    // Delete reply (by posting empty comment)
    await mybusinessbusinessinformation.accounts.locations.reviews.deleteReply({
      name: `accounts/${googleAccountId}/locations/${googleLocationId}/reviews/${reviewId}/reply`
    });
    
    console.log('✅ Reply deleted successfully');
    
    return { success: true };
    
  } catch (err) {
    console.error('❌ Delete reply error:', err);
    throw new Error(`Failed to delete reply: ${err.message}`);
  }
}

/**
 * Generate mock reviews for testing
 * Remove this in production!
 */
export function generateMockReviews() {
  return [
    {
      id: 'mock-1',
      reviewer: 'Sarah Johnson',
      profilePhotoUrl: null,
      rating: 5,
      text: 'Absolutely loved this place! Best cafe in town. Will definitely come back!',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      hasReply: false,
      existingReply: null
    },
    {
      id: 'mock-2',
      reviewer: 'Mike Chen',
      profilePhotoUrl: null,
      rating: 5,
      text: 'Great food but terrible service. Waited 45 minutes for our order!',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      hasReply: false,
      existingReply: null
    },
    {
      id: 'mock-3',
      reviewer: 'Emily Rodriguez',
      profilePhotoUrl: null,
      rating: 4,
      text: 'Good coffee, nice ambiance. A bit pricey but worth it.',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      hasReply: false,
      existingReply: null
    },
    {
      id: 'mock-4',
      reviewer: 'David Kim',
      profilePhotoUrl: null,
      rating: 2,
      text: 'Disappointed. The food was cold and the staff was rude.',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      hasReply: false,
      existingReply: null
    }
  ];
}