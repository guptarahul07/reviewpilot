import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

async function test() {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello!" }]
    });
    console.log('✅ API Key works!', message.content);
  } catch (error) {
    console.error('❌ API Key failed:', error.message);
    console.error('Status:', error.status);
  }
}

test();