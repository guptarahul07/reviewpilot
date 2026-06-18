import express from 'express';
import axios from 'axios';
import { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { checkTrialFeature } from '../middleware/trialGate.js';
import { checkSubscription } from '../middleware/checkSubscription.js';

const router = express.Router();

const CACHE_TTL_HOURS = 24;
const INDUSTRY_RESPONSE_RATE = 65;
const INDUSTRY_RESPONSE_HOURS = 4.0;

const STOP_WORDS = new Set([
  'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on',
  'at', 'to', 'for', 'of', 'with', 'by', 'from', 'was',
  'are', 'were', 'will', 'have', 'has', 'had', 'this',
  'that', 'they', 'we', 'i', 'my', 'your', 'it', 'its',
  'very', 'so', 'just', 'would', 'could', 'should', 'also',
  'not', 'no', 'be', 'been', 'do', 'did', 'get', 'got',
  'me', 'him', 'her', 'us', 'them', 'their', 'our', 'its',
  'he', 'she', 'as', 'if', 'up', 'out', 'about', 'than',
  'then', 'when', 'where', 'what', 'which', 'who', 'how'
]);

// ─────────────────────────────────────────────
// Mock data — used when real data unavailable
// ─────────────────────────────────────────────
function getMockData() {
  return {
    sentiment: { positive: 70, neutral: 20, negative: 10 },
    keywords: {
      positive: [
        { word: 'food', count: 34 }, { word: 'service', count: 28 },
        { word: 'taste', count: 19 }, { word: 'staff', count: 15 },
        { word: 'ambience', count: 12 }, { word: 'clean', count: 10 },
        { word: 'fresh', count: 9 }, { word: 'quick', count: 8 },
        { word: 'friendly', count: 7 }, { word: 'value', count: 6 }
      ],
      negative: [
        { word: 'wait', count: 12 }, { word: 'slow', count: 9 },
        { word: 'expensive', count: 7 }, { word: 'cold', count: 5 },
        { word: 'noisy', count: 4 }, { word: 'parking', count: 3 },
        { word: 'crowded', count: 3 }, { word: 'rude', count: 2 },
        { word: 'dirty', count: 2 }, { word: 'overpriced', count: 1 }
      ]
    },
    ratingTrend: {
      monthly: [
        { month: 'Dec 2025', avgRating: 4.1, reviewCount: 12 },
        { month: 'Jan 2026', avgRating: 4.2, reviewCount: 15 },
        { month: 'Feb 2026', avgRating: 4.0, reviewCount: 10 },
        { month: 'Mar 2026', avgRating: 4.4, reviewCount: 18 },
        { month: 'Apr 2026', avgRating: 4.5, reviewCount: 22 },
        { month: 'May 2026', avgRating: 4.6, reviewCount: 8 }
      ]
    },
    responseRate: {
      totalReviews: 45,
      repliedReviews: 39,
      rate: 86.7,
      industryAverage: INDUSTRY_RESPONSE_RATE
    },
    responseSpeed: {
      avgHours: 2.3,
      industryAverage: INDUSTRY_RESPONSE_HOURS
    },
    insight: {
      summary: 'Customers love your food quality but mention long wait times'
    },
    isMockData: true
  };
}

// ─────────────────────────────────────────────
// Check if cache is still fresh
// ─────────────────────────────────────────────
function isCacheFresh(lastUpdated) {
  if (!lastUpdated) return false;
  const updatedAt = lastUpdated.toDate ? lastUpdated.toDate() : new Date(lastUpdated);
  const hoursSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
  return hoursSince < CACHE_TTL_HOURS;
}

// ─────────────────────────────────────────────
// Calculate sentiment distribution from reviews
// ─────────────────────────────────────────────
function calculateSentiment(reviews) {
  const total = reviews.length;
  if (total === 0) return { positive: 0, neutral: 0, negative: 0 };

  let positive = 0, neutral = 0, negative = 0;

  for (const review of reviews) {
    // Use stored sentiment label if available, else derive from rating
    const label = review.sentiment?.toLowerCase() || '';
    if (label === 'positive' || review.rating >= 4) positive++;
    else if (label === 'negative' || review.rating <= 2) negative++;
    else neutral++;
  }

  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100)
  };
}

// ─────────────────────────────────────────────
// Extract top keywords from review texts
// ─────────────────────────────────────────────
function extractKeywords(reviews, isPositive) {
  const filtered = reviews.filter(r =>
    isPositive ? r.rating >= 4 : r.rating <= 2
  );

  const wordCount = {};

  for (const review of filtered) {
    if (!review.text) continue;
    const words = review.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

// ─────────────────────────────────────────────
// Calculate rating trend — last 6 months
// ─────────────────────────────────────────────
function calculateRatingTrend(reviews) {
  const months = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    months[key] = { ratings: [], month: key };
  }

  for (const review of reviews) {
    const date = review.createTime
      ? new Date(review.createTime)
      : review.createdAt?.toDate
        ? review.createdAt.toDate()
        : new Date(review.createdAt);

    const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (months[key]) {
      months[key].ratings.push(review.rating);
    }
  }

  return {
    monthly: Object.values(months).map(m => ({
      month: m.month,
      avgRating: m.ratings.length > 0
        ? parseFloat((m.ratings.reduce((a, b) => a + b, 0) / m.ratings.length).toFixed(1))
        : null,
      reviewCount: m.ratings.length
    }))
  };
}

// ─────────────────────────────────────────────
// Calculate response rate
// ─────────────────────────────────────────────
function calculateResponseRate(reviews) {
  const total = reviews.length;
  const replied = reviews.filter(r =>
    r.status === 'posted' ||
    r.status === 'posted_auto' ||
    r.status === 'posted_manual' ||
    r.status === 'posted_bulk'
  ).length;

  return {
    totalReviews: total,
    repliedReviews: replied,
    rate: total > 0 ? parseFloat(((replied / total) * 100).toFixed(1)) : 0,
    industryAverage: INDUSTRY_RESPONSE_RATE
  };
}

// ─────────────────────────────────────────────
// Calculate response speed
// ─────────────────────────────────────────────
function calculateResponseSpeed(reviews) {
  const repliedReviews = reviews.filter(r => r.postedAt && r.createTime);
  if (repliedReviews.length === 0) {
    return { avgHours: null, industryAverage: INDUSTRY_RESPONSE_HOURS };
  }

  const totalHours = repliedReviews.reduce((sum, review) => {
    const created = new Date(review.createTime);
    const posted = review.postedAt?.toDate
      ? review.postedAt.toDate()
      : new Date(review.postedAt);
    const hours = (posted - created) / (1000 * 60 * 60);
    return sum + (hours > 0 ? hours : 0);
  }, 0);

  return {
    avgHours: parseFloat((totalHours / repliedReviews.length).toFixed(1)),
    industryAverage: INDUSTRY_RESPONSE_HOURS
  };
}

// ─────────────────────────────────────────────
// Generate AI insight summary via Claude
// ─────────────────────────────────────────────
async function generateInsightSummary(sentiment, keywords) {
  try {
    const positiveWords = keywords.positive.slice(0, 4).map(k => k.word).join(', ');
    const negativeWords = keywords.negative.slice(0, 3).map(k => k.word).join(', ');

    const prompt = `Based on these customer review analytics, write ONE concise insight sentence (max 15 words) about what customers think.

Positive keywords: ${positiveWords}
Negative keywords: ${negativeWords}
Sentiment: ${sentiment.positive}% positive, ${sentiment.neutral}% neutral, ${sentiment.negative}% negative

Example format: "Customers love your [strength] but mention [weakness]"

Respond with ONLY the insight sentence, nothing else.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 60,
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

    return response.data.content[0].text.trim();

  } catch (err) {
    console.warn('[analytics] AI insight generation failed:', err.message);
    return 'Customers appreciate your service quality and overall experience.';
  }
}

// ─────────────────────────────────────────────
// Core analytics calculation — Option A (on-demand with 24hr cache)
// ─────────────────────────────────────────────
async function getOrCalculateAnalytics(uid) {
  // Check cache first
  const cacheRef = db.collection('users').doc(uid).collection('analytics').doc('summary');
  const cacheDoc = await cacheRef.get();

  if (cacheDoc.exists && isCacheFresh(cacheDoc.data()?.lastUpdated)) {
    console.log(`[analytics] Serving cached data for user: ${uid}`);
    return { ...cacheDoc.data(), fromCache: true };
  }

  console.log(`[analytics] Calculating fresh analytics for user: ${uid}`);

  // Fetch all reviews
  const snapshot = await db
    .collection('users')
    .doc(uid)
    .collection('reviews')
    .get();

  // Not enough real data — return mock
  if (snapshot.empty || snapshot.size < 3) {
    console.log(`[analytics] Not enough reviews (${snapshot.size}), returning mock data`);
    return getMockData();
  }

  const reviews = snapshot.docs.map(doc => doc.data());

  // Calculate all metrics
  const sentiment = calculateSentiment(reviews);
  const keywords = {
    positive: extractKeywords(reviews, true),
    negative: extractKeywords(reviews, false)
  };
  const ratingTrend = calculateRatingTrend(reviews);
  const responseRate = calculateResponseRate(reviews);
  const responseSpeed = calculateResponseSpeed(reviews);

  // Generate AI insight
  const insightSummary = await generateInsightSummary(sentiment, keywords);

  const analyticsData = {
    sentiment,
    keywords,
    ratingTrend,
    responseRate,
    responseSpeed,
    insight: { summary: insightSummary },
    lastUpdated: new Date(),
    isMockData: false
  };

  // Save to cache
  await cacheRef.set(analyticsData);
  console.log(`[analytics] Analytics calculated and cached for user: ${uid}`);

  return analyticsData;
}

// ─────────────────────────────────────────────
// GET /api/analytics/summary
// Main endpoint — returns all analytics in one call
// ─────────────────────────────────────────────
router.get('/summary', verifyFirebaseToken, checkSubscription, async (req, res) => {
  const uid = req.uid;
  console.log(`📊 [GET /api/analytics/summary] User: ${uid}`);

  try {
    const data = await getOrCalculateAnalytics(uid);

    res.json({
      success: true,
      data: {
        sentiment: data.sentiment,
        keywords: data.keywords,
        ratingTrend: data.ratingTrend,
        responseRate: data.responseRate,
        responseSpeed: data.responseSpeed,
        insight: data.insight,
        lastUpdated: data.lastUpdated,
        isMockData: data.isMockData ?? false
      }
    });

  } catch (err) {
    console.error('❌ [GET /api/analytics/summary] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// ─────────────────────────────────────────────
// GET /api/analytics/sentiment
// ─────────────────────────────────────────────
router.get('/sentiment', verifyFirebaseToken, checkSubscription, async (req, res) => {
  const uid = req.uid;
  try {
    const data = await getOrCalculateAnalytics(uid);
    res.json({ success: true, data: data.sentiment, isMockData: data.isMockData ?? false });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sentiment' });
  }
});

// ─────────────────────────────────────────────
// GET /api/analytics/keywords
// ─────────────────────────────────────────────
router.get('/keywords', verifyFirebaseToken, checkSubscription, checkTrialFeature('keywordAnalysis'), async (req, res) => {
  const uid = req.uid;
  try {
    const data = await getOrCalculateAnalytics(uid);
    res.json({ success: true, data: data.keywords, isMockData: data.isMockData ?? false });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch keywords' });
  }
});

// ─────────────────────────────────────────────
// GET /api/analytics/rating-trend
// ─────────────────────────────────────────────
router.get('/rating-trend', verifyFirebaseToken, checkSubscription, async (req, res) => {
  const uid = req.uid;
  try {
    const data = await getOrCalculateAnalytics(uid);
    res.json({ success: true, data: data.ratingTrend, isMockData: data.isMockData ?? false });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch rating trend' });
  }
});

// ─────────────────────────────────────────────
// GET /api/analytics/response-stats
// ─────────────────────────────────────────────
router.get('/response-stats', verifyFirebaseToken, checkSubscription, checkTrialFeature('responseRate'), async (req, res) => {
  const uid = req.uid;
  try {
    const data = await getOrCalculateAnalytics(uid);
    res.json({
      success: true,
      data: {
        responseRate: data.responseRate,
        responseSpeed: data.responseSpeed
      },
      isMockData: data.isMockData ?? false
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch response stats' });
  }
});

// ─────────────────────────────────────────────
// POST /api/analytics/refresh
// Force refresh cache (admin or on-demand)
// ─────────────────────────────────────────────
router.post('/refresh', verifyFirebaseToken, checkSubscription, async (req, res) => {
  const uid = req.uid;
  console.log(`🔄 [POST /api/analytics/refresh] Force refresh for user: ${uid}`);

  try {
    // Delete cache to force recalculation
    await db.collection('users').doc(uid).collection('analytics').doc('summary').delete();
    const data = await getOrCalculateAnalytics(uid);

    res.json({ success: true, message: 'Analytics refreshed', isMockData: data.isMockData ?? false });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to refresh analytics' });
  }
});

export default router;