import { generateReply } from "./aiService.js";

export async function processReview(review, userSettings) {

  const reply = await generateReply({
    reviewText: review.text,
    reviewerName: review.reviewerName,
    businessName: userSettings.businessName,
    rating: review.rating,
    replyTone: userSettings.replyTone,
  });

  if (review.rating >= 4 && userSettings.autoReply) {
    return {
      aiReply: reply,
      status: "auto_replied",
    };
  }

  return {
    aiReply: reply,
    status: "needs_attention",
  };
}