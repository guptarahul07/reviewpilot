process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { db } from "./firebaseAdmin.js"
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

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
    "warm",
    "friendly",
    "casual",
    "professional",
    "appreciative"
  ];

  const style = styles[Math.floor(Math.random() * styles.length)];
  
  const topic = detectTopic(review.text);
  
  const topicLine = topic
  ? `Try to acknowledge the mention of ${topic}.`
  : "";

  const prompt = `
	You are a local business owner replying to a customer review.

	Tone:
	Write in a ${style} tone.

	Rules:
	- Maximum 70 words
	- Use natural conversational language
	- Avoid repetitive phrases
	- Vary sentence structure
	Mention a detail from the review naturally
	${topicLine}
	- Do NOT repeat the review word-for-word
	- Do NOT mention AI
	- Do NOT include signatures
	- Avoid phrases like "Thanks so much", "We're thrilled", "Hope to see you again"

	Past replies (avoid repeating tone, phrasing, structure):
	${pastReplies.length ? pastReplies.join("\n") : "None"}

	Do not repeat similar openings or patterns from these replies.

	Rating: ${review.rating}
	Review: "${review.text}"

	Write the reply.
	`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
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
app.post("/api/reviews/sync", async (req, res) => {

  console.log("🔥 HIT /api/reviews/sync");

  try {

    // TEMP USER ID (until we enforce Firebase auth in backend)
    const uid = "demo-user";

    const mockReviews = [
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
        text: "Nice place and good pastries."
      }
    ];

    const results = [];

	const pastReplies = await getRecentReplies(uid);
    for (const review of mockReviews) {      
	  const aiReply = await generateAIReply(review, pastReplies);

      const status =
        review.rating >= 4
          ? "auto_replied"
          : "needs_attention";

      const reviewData = {
        ...review,
        aiReply,
        status,
        createdAt: new Date()
      };

      await db
        .collection("users")
        .doc(uid)
        .collection("reviews")
        .doc(review.id)
        .set(reviewData);

      results.push(reviewData);
    }

    res.json({ reviews: results });

  } catch (err) {

    console.error("Sync error:", err);
    res.status(500).json({ error: "Sync failed" });

  }

});

/* ─────────────────────────────────────────────
   CONFIRM LOW RATING REPLY
───────────────────────────────────────────── */
app.post("/api/reviews/confirm", async (req, res) => {

  console.log("🔥 HIT /api/reviews/confirm")

  try {

    const { reviewId } = req.body

    const uid = "demo-user"

    await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .doc(reviewId)
      .update({
        status: "posted"
      })

    res.json({
      success: true
    })

  } catch (err) {

    console.error("Confirm reply error:", err)

    res.status(500).json({
      error: "Confirm failed"
    })

  }

})

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});

app.get("/api/reviews", async (req, res) => {

  console.log("🔥 HIT /api/reviews")

  try {

    const uid = "demo-user"

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .get()

    const reviews = snapshot.docs.map(doc => doc.data())

    res.json({ reviews })

  } catch (err) {

    console.error("Load reviews error:", err)

    res.status(500).json({
      error: "Failed to load reviews"
    })

  }

})

app.get("/api/reviews/insights", async (req, res) => {

  try {

    const uid = "demo-user"

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("reviews")
      .get()

    const reviews = snapshot.docs.map(doc => doc.data().text)

    const prompt = `
Summarize the key positive and negative themes from these customer reviews.

Return the result strictly in this format:

Positive trends:
- bullet points

Negative trends:
- bullet points

Reviews:
${reviews.join("\n")}
`

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
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
    )

    const insights = response.data.content[0].text

    res.json({ insights })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "Failed to generate insights"
    })

  }

})