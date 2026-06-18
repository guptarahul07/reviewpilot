// backend/services/businessProfileService.js
// Section 13 — Business Profile context for AI replies
// Fetches and caches GBP business profile data for context-aware AI replies

import { db } from '../firebaseAdmin.js';
import { getAuthenticatedClient } from './googleOAuth.js';

const PROFILE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────
// Section 13.3 — Category to business type mapping
// ─────────────────────────────────────────────
const CATEGORY_TO_TYPE = {
  restaurant: ['restaurant', 'cafe', 'dhaba', 'food', 'dining', 'cuisine', 'bistro', 'eatery', 'biryani', 'pizza', 'burger', 'chinese', 'italian', 'indian'],
  hotel: ['hotel', 'lodge', 'inn', 'resort', 'accommodation', 'guest house', 'hostel', 'motel'],
  salon: ['salon', 'spa', 'beauty', 'hair', 'barber', 'grooming', 'wellness', 'nail', 'makeup'],
  clinic: ['clinic', 'hospital', 'doctor', 'medical', 'dental', 'health', 'pharmacy', 'diagnostic', 'optician'],
  retail: ['shop', 'store', 'retail', 'boutique', 'mart', 'bazaar', 'electronics', 'clothing', 'jewellery'],
  gym: ['gym', 'fitness', 'yoga', 'crossfit', 'workout', 'sports', 'pilates', 'zumba'],
  app_developer: ['software', 'app', 'technology', 'tech', 'digital', 'developer', 'IT']
};

export const BUSINESS_TYPE_CONTEXT = {
  restaurant: 'food quality, taste, portion size, service speed, ambience, chef specialties, hygiene, delivery time',
  hotel: 'room comfort, cleanliness, staff hospitality, amenities, location, check-in experience, breakfast quality',
  salon: 'stylist expertise, hygiene, appointment punctuality, results, product quality, pricing, atmosphere',
  clinic: 'doctor expertise, wait time, staff behavior, cleanliness, treatment effectiveness, appointment availability',
  retail: 'product quality, pricing, staff helpfulness, return policy, availability, variety, store cleanliness',
  gym: 'equipment quality, trainer expertise, cleanliness, timing, membership value, classes variety',
  app_developer: 'app performance, features, bug fixes, update frequency, user experience, customer support',
  general: 'service quality, staff behavior, overall experience, value for money'
};

export function detectBusinessType(categoryName) {
  if (!categoryName) return 'general';
  const lower = categoryName.toLowerCase();
  for (const [type, keywords] of Object.entries(CATEGORY_TO_TYPE)) {
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return 'general';
}

function formatPriceLevel(priceLevel) {
  const map = {
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': '₹ Budget-friendly',
    'PRICE_LEVEL_MODERATE': '₹₹ Mid-range',
    'PRICE_LEVEL_EXPENSIVE': '₹₹₹ Premium',
    'PRICE_LEVEL_VERY_EXPENSIVE': '₹₹₹₹ Luxury'
  };
  return map[priceLevel] || 'Mid-range';
}

// ─────────────────────────────────────────────
// Section 13.2 — Fetch business profile from GBP API
// ─────────────────────────────────────────────
export async function fetchBusinessProfileFromGBP(uid, locationId) {
  console.log(`[BusinessProfile] Fetching from GBP for user: ${uid}, location: ${locationId}`);

  const authClient = await getAuthenticatedClient(uid);
  const tokenResponse = await authClient.getAccessToken();
  const accessToken = tokenResponse.token;

  // Use full location name format
  const locationName = locationId.includes('locations/')
    ? locationId
    : `locations/${locationId}`;

  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=name,title,categories,profile,phoneNumbers,storefrontAddress,websiteUri,regularHours,priceLevel`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();

  return {
    businessName: data.title || '',
    primaryCategory: data.categories?.primaryCategory?.displayName || '',
    additionalCategories: data.categories?.additionalCategories?.map(c => c.displayName) || [],
    description: data.profile?.description || '',
    priceLevel: data.priceLevel || 'PRICE_LEVEL_UNSPECIFIED',
    city: data.storefrontAddress?.locality || '',
    state: data.storefrontAddress?.administrativeArea || '',
    website: data.websiteUri || '',
    phone: data.phoneNumbers?.primaryPhone || ''
  };
}

// ─────────────────────────────────────────────
// Get business profile — from cache or fetch fresh
// ─────────────────────────────────────────────
export async function getBusinessProfile(uid, locationId) {
  const cacheId = `${uid}_${locationId}`;
  const cacheRef = db.collection('businessProfiles').doc(cacheId);

  try {
    const cached = await cacheRef.get();

    if (cached.exists) {
      const data = cached.data();
      const lastRefreshed = data.lastRefreshedAt?.toDate
        ? data.lastRefreshedAt.toDate()
        : new Date(data.lastRefreshedAt);

      const isStale = (Date.now() - lastRefreshed.getTime()) > PROFILE_REFRESH_MS;

      if (!isStale) {
        console.log(`[BusinessProfile] Serving cached profile for ${cacheId}`);
        return data;
      }
    }

    // Fetch fresh from GBP
    const profile = await fetchBusinessProfileFromGBP(uid, locationId);
    const profileData = {
      ...profile,
      uid,
      locationId,
      fetchedAt: new Date(),
      lastRefreshedAt: new Date()
    };

    await cacheRef.set(profileData);
    console.log(`[BusinessProfile] Cached fresh profile for ${cacheId}`);

    return profileData;

  } catch (err) {
    console.warn(`[BusinessProfile] Could not fetch profile: ${err.message}`);

    // Return minimal profile from user doc as fallback
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    return {
      businessName: userData.settings?.businessName || userData['settings.businessName'] || '',
      primaryCategory: '',
      city: '',
      state: '',
      description: '',
      priceLevel: 'PRICE_LEVEL_UNSPECIFIED'
    };
  }
}

// ─────────────────────────────────────────────
// Section 13.5 — Trigger profile fetch on GBP connect
// and refresh weekly via cron
// ─────────────────────────────────────────────
export async function refreshBusinessProfileIfNeeded(uid, locationId) {
  const cacheId = `${uid}_${locationId}`;
  const cacheRef = db.collection('businessProfiles').doc(cacheId);

  try {
    const cached = await cacheRef.get();
    if (!cached.exists) {
      await getBusinessProfile(uid, locationId);
      return;
    }

    const lastRefreshed = cached.data().lastRefreshedAt?.toDate
      ? cached.data().lastRefreshedAt.toDate()
      : new Date(cached.data().lastRefreshedAt);

    if ((Date.now() - lastRefreshed.getTime()) > PROFILE_REFRESH_MS) {
      console.log(`[BusinessProfile] Refreshing stale profile for ${cacheId}`);
      await getBusinessProfile(uid, locationId);
    }
  } catch (err) {
    console.warn(`[BusinessProfile] Refresh check failed: ${err.message}`);
  }
}
