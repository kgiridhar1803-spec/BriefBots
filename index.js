import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { OpenAI } from 'openai';
import { getSubtitles } from 'youtube-caption-extractor';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1' 
});

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function scrapeGeneralWebpage(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    $('script, style, nav, footer, header, iframe, noscript, head, svg').remove();
    let blocks = [];
    $('p').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt.length > 30) blocks.push(txt);
    });
    return blocks.join(' ');
  } catch (err) {
    throw new Error('Scraper fail: ' + err.message);
  }
}

app.post('/api/analyze', async (req, res) => {
  const { type, content, language } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Input cannot be empty.' });
  }

  const targetLanguage = language || 'English';
  let textToAnalyze = content;

  try {
    if (type === 'url') {
      const videoId = extractYouTubeId(content);
      if (videoId) {
        try {
          const lines = await getSubtitles({ videoID: videoId, lang: 'en' });
          textToAnalyze = lines.map(l => l.text).join(' ');
        } catch (e) {
          return res.status(422).json({ error: 'YouTube transcripts unavailable.' });
        }
      } else {
        try {
          textToAnalyze = await scrapeGeneralWebpage(content);
        } catch (e) {
          return res.status(422).json({ error: e.message });
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 40) {
      return res.status(400).json({ error: 'No readable text content found.' });
    }

    const safeTextSample = String(textToAnalyze)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2200);

    const systemInstruction = `You are an expert analyst. Summarize the text using exactly 10 to 12 structured, highly readable bullet points. 
    CRITICAL RULE: You MUST translate and write all bullet points entirely in the following language: ${targetLanguage}. 
    For EVERY bullet point, you MUST bold (**like this**) the most important phrases, keywords, entities, or core values to optimize readability. Write exclusively in the specified target language without conversational formatting filler.`;

    const response = await openai.chat.completions.create({
      model: 'qwen/qwen3-32b', 
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Text to process:\n${safeTextSample}` }
      ],
      max_tokens: 700,
      temperature: 0.4,
      // FIXED: Force the Groq API to hide reasoning tokens completely from the output
      reasoning_format: "hidden" 
    });

    const aiOutput = response.choices[0]?.message?.content || "No analysis generated.";
    return res.json({ data: aiOutput });

  } catch (error) {
    return res.status(500).json({ error: 'Server processing issue: ' + error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, contextSummary, chatHistory } = req.body;
  try {
    const systemPrompt = `You are a helpful AI assistant. Answer questions regarding the provided Summary Context. Always prioritize information inside the context.
    Summary Context: "${contextSummary}"`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: formattedMessages,
      max_tokens: 300,
      temperature: 0.7,
      // FIXED: Hide reasoning here as well for clean chatbot responses
      reasoning_format: "hidden" 
    });

    return res.json({ reply: response.choices[0]?.message?.content || "I couldn't process that response." });
  } catch (error) {
    return res.status(500).json({ error: 'Chat processing issue: ' + error.message });
  }
});

app.listen(port, () => {
  console.log('Server online with Structured Bullet Formatting Engine!');
});