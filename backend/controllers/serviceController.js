import axios from 'axios';
import History from '../models/History.js';
import mongoose from 'mongoose';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const saveHistory = async (userId, type, data) => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  try {
    return await History.create({ userId, type, data });
  } catch (error) {
    console.warn(`Skipping history save for ${type}:`, error.message);
    return null;
  }
};

const pestAdviceMap = {
  aphids: 'Inspect the underside of leaves, control ant movement, and consider neem oil or a label-approved systemic spray if populations are increasing.',
  armyworm: 'Scout in the evening, check whorl damage, and manage early with biological controls or crop-safe insecticide before larvae mature.',
  beetle: 'Hand-remove where possible, watch edge rows first, and use crop-specific beetle control if feeding damage crosses threshold.',
  bollworm: 'Check buds and fruiting bodies closely, install pheromone traps, and time sprays to early larval stages.',
  grasshopper: 'Monitor field borders and grassy bunds, reduce nearby weed hosts, and intervene early when hopper numbers rise.',
  mites: 'Avoid unnecessary broad-spectrum sprays, improve moisture balance, and use a miticide only after confirming active infestation.',
  mosquito: 'Reduce stagnant water and manage humidity-heavy zones around the farm.',
  sawfly: 'Look for chewing damage and clustered larvae, then target small larvae before heavy defoliation starts.',
  stem_borer: 'Inspect dead hearts or bore holes, remove affected shoots when practical, and use crop-stage-specific control measures.',
};

const buildFallbackReply = (message, context = {}) => {
  const normalized = message.toLowerCase();
  const weatherLine = context.locationName
    ? `For ${context.locationName}${context.temperature != null ? ` at about ${Math.round(context.temperature)}°C` : ''}, `
    : '';

  if (normalized.includes('water') || normalized.includes('irrig')) {
    return `${weatherLine}check topsoil moisture before irrigating. Water early in the morning, avoid standing water, and reduce frequency if the root zone is still wet.`;
  }

  if (normalized.includes('fertiliz') || normalized.includes('nutrient') || normalized.includes('npk')) {
    return `${weatherLine}base fertilizer decisions on a soil test, split nitrogen into stages, and avoid raising all nutrients together unless symptoms and soil data support it.`;
  }

  if (normalized.includes('pest') || normalized.includes('disease') || normalized.includes('leaf') || normalized.includes('spray')) {
    return `${weatherLine}confirm the symptom first, isolate heavily affected plants, and spray only after checking crop stage, pest pressure, and the label-safe product for that crop.`;
  }

  if (normalized.includes('rain') || normalized.includes('weather')) {
    return `${weatherLine}avoid spraying before rainfall, keep drainage open, and use calmer wind windows for field operations.`;
  }

  return `${weatherLine}share your crop, growth stage, field symptom, and recent weather so I can give a more accurate next step.`;
};

const cleanModelReply = (rawReply, prompt) => {
  if (!rawReply) {
    return '';
  }

  return rawReply.replace(prompt, '').replace(/^AI:\s*/i, '').trim();
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

export const recommendFertilizer = async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/recommend-fertilizer`, req.body);

    await saveHistory(req.user, 'fertilizer_recommendation', {
      inputs: req.body,
      fertilizer: response.data.fertilizer,
      confidence: response.data.confidence,
      explanation: response.data.explanation,
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Fertilizer recommendation error:', error.message);
    return res.status(503).json({
      message: 'Error predicting fertilizer. Make sure the ML service is running.',
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
    formData.append('image', blob, req.file.originalname || 'crop-image.jpg');

    const response = await axios.post(`${ML_SERVICE_URL}/analyze-disease`, formData, {
      maxBodyLength: Infinity,
    });

    await saveHistory(req.user, 'disease_detection', {
      disease: response.data.label || response.data.disease,
      confidence: response.data.confidence,
      treatment: response.data.treatment,
      summary: response.data.summary,
      source: response.data.source,
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Disease detection error:', error.message);
    return res.status(503).json({
      message: 'Error analyzing the crop image. Make sure the ML service is running.',
      error: error.message,
    });
  }
};

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, language, context } = req.body;
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    let aiResponse = '';
    let source = 'fallback';

    if (apiKey) {
      const prompt = [
        'You are a smart crop advisory assistant for Indian farmers.',
        'Answer in short practical steps with local awareness.',
        context?.locationName ? `Location: ${context.locationName}` : '',
        context?.temperature != null ? `Temperature: ${Math.round(context.temperature)} C` : '',
        context?.humidity != null ? `Humidity: ${Math.round(context.humidity)} percent` : '',
        context?.windSpeed != null ? `Wind speed: ${Math.round(context.windSpeed)} kmph` : '',
        `Language hint: ${language || 'en'}`,
        `User: ${message}`,
        'AI:',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const hfResponse = await axios.post(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
          { inputs: prompt, parameters: { max_new_tokens: 180, temperature: 0.3 } },
          { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 },
        );

        aiResponse = cleanModelReply(hfResponse.data?.[0]?.generated_text, prompt);
        if (aiResponse) {
          source = 'huggingface';
        }
      } catch {
        aiResponse = '';
      }
    }

    if (!aiResponse) {
      const matchedPest = Object.keys(pestAdviceMap).find((key) => message.toLowerCase().includes(key.replace('_', ' ')));
      if (matchedPest) {
        aiResponse = pestAdviceMap[matchedPest];
      } else {
        aiResponse = buildFallbackReply(message, context);
      }
      source = 'fallback';
    }

    await saveHistory(req.user, 'chat', {
      user_message: message,
      ai_response: aiResponse,
      language,
      context,
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

export const deleteHistoryEntry = async (req, res) => {
  try {
    const historyItem = await History.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!historyItem) {
      return res.status(404).json({ message: 'History item not found.' });
    }

    return res.json({ success: true, id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting history item', error: error.message });
  }
};
