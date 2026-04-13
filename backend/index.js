// Step 1: Load dotenv FIRST
import dotenv from "dotenv";
dotenv.config();

// Step 2: Now set environment variable (after dotenv loads)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Step 3: Now all other imports
import { db } from "./firebaseAdmin.js";
import analyticsRoutes from './routes/analytics.js';
import oauthRoutes from './routes/oauth.js';
import { trackEvent } from './utils/analytics.js';
import { fetchGoogleReviews, postReplyToGoogle } from './services/googleReviews.js';
import { hasMixedSentiment, analyzeSentiment } from './services/sentimentAnalysis.js';
import express from "express";
import cors from "cors";
import axios from "axios";
import admin from 'firebase-admin';

const app = express();

// Update CORS to allow Vercel domain
app.use(cors({
  origin: [
    'http://localhost:5173',  // Local development
    'https://reviewpilot-one.vercel.app',  // Vercel preview
    'https://reviewpilot.live'  // Production domain
  ],
  credentials: true
}));

app.use(express.json());

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Analytics routes
app.use('/api', analyticsRoutes);
app.use('/api', oauthRoutes);

/* ─────────────────────────────────────────────
   MOCK REVIEWS FOR MVP (Replace later with Google API)
───────────────────────────────────────────── */
function getMockReviews() {
  return [
    {
      id: "r1",
      reviewer: "Tom",
      rating: 5,
      date: "2 hours ago",
      text: "Absolutely loved the coffee and vibe!"
    },
    {
      id: "r2",
      reviewer: "Anita",
      rating: 2,
      date: "5 hours ago",
      text: "Waited too long for my order."
    },
    {
      id: "r3",
      reviewer: "Rahul",
      rating: 4,
      date: "1 day ago",
      text: "Nice place. Will visit again."
    }
  ];
}

function detectTopic(text) {

  const topics = ["coffee", "service", "staff", "parking", "pastries", "food", "atmosphere"];

  for (let topic of topics) {
    if (text.toLowerCase().includes(topic)) {
      return topic;
    }
  }

  return null;
}

async function getRecentReplies(uid) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();

  return snapshot.docs
    .map(doc => doc.data().aiReply)
    .filter(Boolean);
}

/* ─────────────────────────────────────────────
   AI GENERATION FUNCTION
───────────────────────────────────────────── */
async function generateAIReply(review, pastReplies = []) {
  const styles = [
    "casual",
    "friendly", 
    "brief",
    "warm"
  ];

  const style = styles[Math.floor(Math.random() * styles.length)];
  
  const topic = detectTopic(review.text);
  
  const topicLine = topic
    ? `Acknowledge "${topic}" naturally in 1-2 words max.`
    : "";

  const prompt = `
You are a casual Indian cafe owner replying to a Google review.

CRITICAL RULES:
- Maximum 25 words (strict limit!)
- Write like a real person texting, not a corporation
- Use simple, everyday language
- No flowery phrases like "wonderful surprise", "brightens our day", "means everything"
- No multiple exclamation marks
- One sentence is fine
- Can use emojis (☕ 😊 🙏) sparingly

${topicLine}

Tone: ${style}

Past replies (don't repeat patterns):
${pastReplies.slice(0, 3).join("\n") || "None"}

Rating: ${review.rating} stars
Review: "${review.text}"

Reply (max 25 words):
`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 60,  // Reduced from 120
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }]
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    }
  );

  return response.data.content[0].text.trim();
}

/* ─────────────────────────────────────────────
   SYNC REVIEWS (SEMI-AUTOMATED LOGIC)
───────────────────────────────────────────── */
app.post("/api/reviews/sync", verifyFirebaseToken, async (req, res) => {
  //console.log("🔥 HIT /api/reviews/sync");

  try {
    const uid = req.uid;

    // Fetch reviews from Google My Business API
    let googleReviews = [];
    
    try {
      googleReviews = await fetchGoogleReviews(uid);
      console.log(`✅ Fetched ${googleReviews.length} reviews from Google`);
    } catch (err) {
      console.warn('⚠️ Google Business API not ready yet');
  console.warn('⚠️ Using mock reviews for testing');
  
  // Import and use mock data
  const { generateMockReviews } = await import('./services/googleReviews.js');
  googleReviews = generateMockReviews();  // ← Continue with mock data
  
  //console.log(`✅ Generated ${googleReviews.length} mock reviews`);
    }

    const results = [];
    const pastReplies = await getRecentReplies(uid);

    for (const review of googleReviews) {
      // Skip if already has a reply
      if (review.hasReply) {
        console.log(`⏭️ Skipping review ${review.id} - already has reply`);
        continue;
      }

      // Generate AI reply
      //console.log(`🤖 Generating AI reply for review ${review.id}`);
      const aiReply = await generateAIReply(review, pastReplies);

      // Check sentiment
      const sentimentAnalysis = analyzeSentiment(review.text, review.rating);
      const isMixed = sentimentAnalysis.isMixed;

      // Determine status
      let status;
      if (review.rating >= 4 && !isMixed) {
        status = "auto_replied";  // Safe for auto-posting
      } else {
        status = "needs_attention";  // Needs manual review
      }

      const reviewData = {
        ...review,
        aiReply,
        status,
        sentiment: sentimentAnalysis.label,
        sentimentAnalysis: sentimentAnalysis.indicators,
        hasMixedSentiment: isMixed,
        createdAt: new Date(),
        syncedAt: new Date()
      };

      // Save to Firestore
      await db
        .collection("users")
        .doc(uid)
        .collection("reviews")
        .doc(review.id)
        .set(reviewData, { merge: true });

      results.push(reviewData);
    }

    // Track event
    await trackEvent(uid, 'reviews_synced', { 
      reviewCount: results.length,
      source: 'google_api'
    });

    // Update last sync time
    await db.collection('users').doc(uid).update({
      lastSyncAt: new Date()
    });

    console.log(`✅ Synced ${results.length} new reviews`);

    res.json({ 
      reviews: results, 
      synced: results.length,
      total: googleReviews.length
    });

  } catch (err) {
    console.error("❌ Sync error:", err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

/* ─────────────────────────────────────────────
   REGENERATE AI REPLY
───────────────────────────────────────────── */
app.post("/api/reviews/regenerate", verifyFirebaseToken, async (req, res) => {
  //console.log("🔥 HIT /api/reviews/regenerate");

  try {
    const { reviewId } = req.body;
    const uid = req.uid;

    // Validation
    if (!reviewId) {
      return res.status(400).json({ error: 'reviewId required' });
    }

    // Get the review from Firestore
    const reviewDoc = await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .doc(reviewId)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = reviewDoc.data();
    
    //console.log(`🔄 Regenerating reply for review: ${reviewId}`);
    
    // Get recent replies for context
    const pastReplies = await getRecentReplies(uid);
    
    // Generate new AI reply
    const newReply = await generateAIReply(review, pastReplies);

    //console.log(`✅ New reply generated: ${newReply}`);

    // Update in Firestore
    await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .doc(reviewId)
      .update({
        aiReply: newReply,
        regeneratedAt: new Date()
      });

    res.json({ success: true, newReply });

  } catch (err) {
    console.error("❌ Regenerate error:", err);
    res.status(500).json({ error: "Failed to regenerate reply" });
  }
});


app.post("/api/reviews/post", verifyFirebaseToken, async (req, res) => {
  console.log("🔥 HIT /api/reviews/post");

  try {
    const { reviewId, replyText } = req.body;
    const uid = req.uid;

    // Validation
    if (!reviewId || !replyText) {
      return res.status(400).json({ error: 'reviewId and replyText required' });
    }

    if (replyText.length > 4096) {
      return res.status(400).json({ error: 'Reply too long (max 4096 chars)' });
    }

    console.log(`📤 Posting reply to review ${reviewId}`);

    // Post to Google
    await postReplyToGoogle(uid, reviewId, replyText);

    // Update Firestore
    await db
      .collection('users')
      .doc(uid)
      .collection('reviews')
      .doc(reviewId)
      .update({
        status: 'posted',
        postedReply: replyText,
        postedAt: new Date()
      });

    // Track event
    await trackEvent(uid, 'reply_posted', { 
      reviewId
    });

    console.log(`✅ Reply posted successfully`);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Post reply error:", err);
    res.status(500).json({ error: err.message || "Failed to post reply" });
  }
});

// Add this temporary route to test
app.get("/api/test/sentiment", (req, res) => {
  const testCases = [
    { text: "Great food but terrible service!", rating: 5 },
    { text: "Absolutely loved it! Best restaurant ever.", rating: 5 },
    { text: "Good food however the wait was awful", rating: 4 },
    { text: "If you like cold food and rude staff, this is perfect!", rating: 5 },
  ];
  
  const results = testCases.map(({ text, rating }) => ({
    text,
    rating,
    analysis: analyzeSentiment(text, rating)
  }));
  
  res.json(results);
});

/* ─────────────────────────────────────────────
   CONFIRM LOW RATING REPLY
───────────────────────────────────────────── */
app.post("/api/reviews/confirm", verifyFirebaseToken, async (req, res) => {
  console.log("🔥 HIT /api/reviews/confirm");

  try {
    const { reviewId } = req.body;
    const uid = req.uid;  // ✅ From token

    await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .doc(reviewId)
      .update({
        status: "posted"
      });

    res.json({ success: true });

  } catch (err) {
    console.error("Confirm reply error:", err);
    res.status(500).json({ error: "Confirm failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});

app.get("/api/reviews", verifyFirebaseToken, async (req, res) => {
  //console.log("🔥 HIT /api/reviews");
  
  try {
    const uid = req.uid;  // ✅ From token
    
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .get();

    const reviews = snapshot.docs.map(doc => doc.data());

    res.json({ reviews });

  } catch (err) {
    console.error("Load reviews error:", err);
    res.status(500).json({
      error: "Failed to load reviews"
    });
  }
});

/* ─────────────────────────────────────────────
   GET ACTIONABLE CUSTOMER INSIGHTS
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   IMPROVED INSIGHTS ROUTE - POSITIVE FIRST WITH FOCUS AREAS
   
   Add this to backend/index.js (REPLACE existing /api/reviews/insights route)
───────────────────────────────────────────── */

app.get("/api/reviews/insights", verifyFirebaseToken, async (req, res) => {
  console.log("🔥 HIT /api/reviews/insights");

  try {
    const uid = req.uid;

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .get();

    if (snapshot.empty) {
      return res.json({ insights: "No reviews yet. Sync reviews to see insights." });
    }

    const reviews = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().createTime || doc.data().createdAt
    }));

    // Calculate stats for context
    const totalReviews = reviews.length;
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating <= 3).length;
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);

    const reviewTexts = reviews.map(r => `[${r.rating}★] ${r.text}`).join("\n");

    const prompt = `
You are analyzing customer reviews for a cafe owner in India. Your goal is to provide ENCOURAGING, ACTIONABLE insights that help them improve while acknowledging what's working well.

CRITICAL RULES:
1. START WITH POSITIVE: Always begin with what's working well
2. USE "FOCUS AREAS" not "Issues" or "Problems" - positive framing!
3. Be specific with numbers and patterns
4. Keep it concise and actionable
5. Don't exceed 250 words total

STATS:
- Total: ${totalReviews} reviews
- Positive (4-5★): ${positiveReviews} (${((positiveReviews/totalReviews)*100).toFixed(0)}%)
- Needs work (1-3★): ${negativeReviews}
- Average: ${avgRating}★

Reviews:
${reviewTexts}

Format your response EXACTLY like this:

✅ What's Working Well:
- [Top strength with numbers - e.g., "Coffee quality praised in 8 of 10 reviews"]
- [Second strength with specific mentions]

🎯 Focus Areas:
- [Area needing attention with data - e.g., "Service speed mentioned in 3 reviews during 12-2pm"]
- [Second area with specific pattern]

💡 Quick Wins:
- [Immediate actionable step - e.g., "Add 1 staff member during lunch rush"]
- [Second immediate action]

Keep it SHORT, POSITIVE, and ACTIONABLE. Focus on helping the owner feel encouraged while giving them clear next steps.
`;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        }
      }
    );

    const insights = response.data.content[0].text;

    res.json({ insights });

  } catch (err) {
    console.error("❌ Insights error:", err);
    res.status(500).json({
      error: "Failed to generate insights"
    });
  }
});

// Add this temporary test route
app.get('/api/test/google-business', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.uid;
    
    console.log('🧪 Testing Google Business API access...');
    
    // Try to fetch reviews
    const reviews = await fetchGoogleReviews(uid);
    
    res.json({
      success: true,
      message: 'Google Business API is working!',
      reviewCount: reviews.length,
      reviews: reviews
    });
    
  } catch (err) {
    res.json({
      success: false,
      message: 'Google Business API not ready yet',
      error: err.message,
      suggestion: 'Your business might still be pending verification or API propagation (24-48 hours)'
    });
  }
});

// Check Google connection status
app.get('/api/auth/google/status', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.json({ connected: false });
    }

    const userData = userDoc.data();

    // Check if Google refresh token exists
    if (userData.googleRefreshToken) {
      return res.json({
        connected: true,
        accountName: userData.settings?.businessName || 'Google Business Profile',  // ← YOUR FIELD
        locationName: userData.businessAddress || 'Verified',                        // ← YOUR FIELD
        connectedAt: userData.googleConnectedAt 
          ? userData.googleConnectedAt.toDate().toISOString() 
          : null
      });
    } else {
      return res.json({ connected: false });
    }

  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ 
      error: 'Failed to check connection status',
      connected: false 
    });
  }
});

// Disconnect Google Business
app.post('/api/auth/google/disconnect', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.uid;

    // Remove Google OAuth data using YOUR field names
    await db.collection('users').doc(uid).update({
      googleRefreshToken: null,
      googleAccountId: null,           // ← YOUR FIELD
      googleLocationId: null,          // ← YOUR FIELD
      'settings.businessName': null,   // ← YOUR FIELD
      businessAddress: null,           // ← YOUR FIELD
      googleConnectedAt: null,
      googleDisconnectedAt: new Date()
    });

    res.json({ 
      success: true,
      message: 'Google Business Profile disconnected successfully' 
    });

  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect Google Business Profile' 
    });
  }
});