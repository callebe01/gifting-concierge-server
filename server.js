const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Update CORS options to allow requests from your Chrome extension
const corsOptions = {
  origin: ['chrome-extension://fmnfokfklldocjpkacioflejpopmgopd', 'https://gifting-concierge-server.vercel.app'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

function processGiftName(name) {
  let processedName = name.replace(/\b(v\d+|\d+\.\d+|\s\d+)\b/gi, '');
  processedName = processedName.replace(/\b(series|gen|generation|version)\b/gi, '');
  processedName = processedName.trim().split(/\s+/).slice(0, 5).join(' ');
  return processedName.replace(/^(a|an|the)\s+/i, '');
}

app.post('/generate-gift-ideas', async (req, res) => {
  const { gender, ageGroup, interests, maxPrice } = req.body;

  const prompt = `Suggest 5 gift ideas for a ${gender} ${ageGroup} interested in ${interests.join(', ')} with a budget of $${maxPrice}. Each idea should be 3-5 words maximum, without prepositions or specific version numbers. Focus on general product categories or brands. Examples: "Apple Watch" or "Bose Noise-Cancelling Headphones" or "Leather Messenger Bag".`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      n: 1,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const suggestions = response.data.choices[0].message.content.trim().split('\n').filter(Boolean);
    const giftIdeas = suggestions.map(suggestion => {
      const processedName = processGiftName(suggestion);
      const searchUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(processedName)}&tag=gifterideas-20`;
      return { name: processedName, link: searchUrl };
    });

    res.json(giftIdeas);
  } catch (error) {
    console.error('Error generating gift ideas:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate gift ideas', details: error.response ? error.response.data : error.message });
  }
});

app.post('/generate-gift-ideas-description', async (req, res) => {
  const { description } = req.body;

  const prompt = `Suggest 10 thoughtful and specific gift ideas based on this description: "${description}". Each idea should be 3-5 words maximum, without prepositions or specific version numbers. The first 3 products should be more specific to the person's characteristics and the rest should be more general but still linked. Examples: "Kindle E-reader" or "GoPro Action Camera". Ensure the suggestions are varied and reflect the person's interests and characteristics. Ensure all suggestions are likely available on Amazon.`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      n: 1,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const suggestions = response.data.choices[0].message.content.trim().split('\n').filter(Boolean);
    const giftIdeas = suggestions.map(suggestion => {
      const processedName = processGiftName(suggestion);
      const searchUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(processedName)}&tag=gifterideas-20`;
      return { name: processedName, link: searchUrl };
    });

    res.json(giftIdeas);
  } catch (error) {
    console.error('Error generating gift ideas:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate gift ideas', details: error.response ? error.response.data : error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
