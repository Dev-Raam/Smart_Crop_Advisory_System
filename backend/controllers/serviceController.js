import axios from 'axios';
import History from '../models/History.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const saveHistory = (userId, type, data) => History.create({ userId, type, data });

const buildFallbackReply = (message) => {
  const normalized = message.toLowerCase();

  if (normalized.includes('water') || normalized.includes('irrig')) {
    return 'Check the topsoil moisture first. Water early in the morning, avoid waterlogging, and reduce irrigation if leaves are drooping with wet soil.';
  }

  if (normalized.includes('fertiliz') || normalized.includes('nutrient') || normalized.includes('npk')) {
    return 'Use soil-test values before increasing fertilizer. Split nitrogen doses, keep phosphorus near the root zone, and avoid adding more potassium unless the crop or soil report supports it.';
  }

  if (normalized.includes('pest') || normalized.includes('disease') || normalized.includes('leaf')) {
    return 'Inspect the lower and upper leaf surfaces, isolate badly affected plants, remove heavily damaged leaves, and apply the correct fungicide or insecticide only after confirming the symptom pattern.';
  }

  if (normalized.includes('rain') || normalized.includes('weather')) {
    return 'Plan field work around expected rain, avoid spraying before showers, and keep drainage channels open so roots do not stay saturated.';
  }

  return 'Focus on current soil moisture, crop stage, and visible symptoms before making a field decision. If you share those details, I can suggest the next step more precisely.';
};

export const recommendCrop = async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-crop`, req.body);

    await saveHistory(req.user, 'crop_recommendation', {
      inputs: req.body,
      recommendation: response.data.crop,
      confidence: response.data.confidence,
      fertilizer: response.data.fertilizer,
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Crop prediction error:', error.message);
    return res.status(503).json({
      message: 'Error predicting crop. Make sure the ML service is running.',
      error: error.message,
    });
  }
};

export const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
    formData.append('image', blob, req.file.originalname || 'leaf.jpg');

    const response = await axios.post(`${ML_SERVICE_URL}/analyze-disease`, formData, {
      maxBodyLength: Infinity,
    });

    await saveHistory(req.user, 'disease_detection', {
      disease: response.data.disease,
      confidence: response.data.confidence,
      treatment: response.data.treatment,
      summary: response.data.summary,
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Disease detection error:', error.message);
    return res.status(503).json({
      message: 'Error analyzing the plant image. Make sure the ML service is running.',
      error: error.message,
    });
  }
};

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, language } = req.body;
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    let aiResponse = '';
    let source = 'fallback';

    if (apiKey) {
      const prompt = `You are a helpful smart crop advisory AI assistant for farmers in India. Answer clearly and briefly.\nUser: ${message}\nAI:`;

      try {
        const hfResponse = await axios.post(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
          { inputs: prompt, parameters: { max_new_tokens: 150 } },
          { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 },
        );

        aiResponse = hfResponse.data?.[0]?.generated_text?.replace(prompt, '').trim() || '';
        if (aiResponse) {
          source = 'huggingface';
        }
      } catch {
        aiResponse = '';
      }
    }

    if (!aiResponse) {
      aiResponse = buildFallbackReply(message);
      source = 'fallback';
    }

    await saveHistory(req.user, 'chat', {
      user_message: message,
      ai_response: aiResponse,
      language,
    });

    return res.json({ reply: aiResponse, source });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ message: 'Error generating chat response', error: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user }).sort({ createdAt: -1 }).limit(50);
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};
