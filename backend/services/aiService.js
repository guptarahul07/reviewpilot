import axios from "axios";

export async function generateReply({
  reviewText,
  reviewerName,
  businessName,
  rating,
  replyTone = "friendly",
}) {

  const firstName = reviewerName?.split(" ")[0] || null;

  const prompt = `
You are the owner of ${businessName} replying to a Google review.

Tone:
Warm, natural, conversational. Not corporate.

Rules:
- Keep under 80 words
- Use short sentences
- Do NOT mention AI
- Do NOT use placeholders
- Do NOT include signatures
- Avoid repeating the review

Greeting:
${firstName ? `Start with: Hi ${firstName},` : "No greeting needed."}

Rating guidance:
- 4–5 stars → appreciative and inviting
- 3 stars → appreciative + acknowledge issue briefly
- 1–2 stars → apologize sincerely + reassure

Review:
"${reviewText}"

Write the reply now.
`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 180,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  return response.data.content[0].text.trim();
}