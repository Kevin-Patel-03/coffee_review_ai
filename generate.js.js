// api/generate.js
import { Groq } from 'groq-sdk';

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

export default async function handler(req, res) {
  // 1. Handle CORS preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 3. Parse the request body
  const { products, rating } = req.body;

  if (!products || products.length === 0) {
    return res.status(400).json({ error: 'No products selected' });
  }

  const productList = products.join(', ');
  const starEmoji = rating >= 5 ? '🌟🌟🌟🌟🌟' : rating >= 4 ? '⭐⭐⭐⭐' : '⭐⭐⭐';

  // 4. The AI prompt (engineered for authentic, non-repetitive reviews)
  const prompt = `
    Write a unique, authentic, and enthusiastic Google-style review for a coffee shop called "Nothing Before Coffee".
    The customer ordered: ${productList}.
    Their rating: ${rating}/5 stars.
    
    Requirements:
    - Sound like a real, happy customer (natural tone, first-person).
    - Mention the quality of the food/drinks, the vibe of the place, and the value for money.
    - If the rating is high (4-5), be highly positive. If lower, be honest but constructive.
    - Do NOT use phrases like "as an AI", "here is a review", or "I think".
    - Keep it between 50 to 80 words.
    - Make it completely different from any other review (use varied vocabulary).
    - End with a strong recommendation or closing line.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192', // Fast, free-tier friendly, and highly intelligent
      temperature: 0.85,         // High creativity for infinite variations
      max_tokens: 200,
    });

    let review = chatCompletion.choices[0]?.message?.content || '';
    // Clean up any accidental markdown or quotes
    review = review.replace(/^["']|["']$/g, '').trim();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ review });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again.' 
    });
  }
}