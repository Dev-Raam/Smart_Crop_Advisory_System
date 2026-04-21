import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/smartcrop';

app.use(cors());
app.use(express.json());

app.locals.dbStatus = {
  connected: false,
  uri: null,
  message: 'Database connection has not started yet.',
};

const tryConnectMongo = async (uri, label) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  app.locals.dbStatus = {
    connected: true,
    uri: label,
    message: `Connected to ${label}`,
  };
  console.log(`MongoDB connected via ${label}`);
};

const connectDatabase = async () => {
  const primaryUri = process.env.MONGO_URI || LOCAL_MONGO_URI;

  try {
    await tryConnectMongo(primaryUri, primaryUri === LOCAL_MONGO_URI ? 'local MongoDB' : 'MongoDB Atlas');
    return;
  } catch (primaryError) {
    console.error(`Primary MongoDB connection failed: ${primaryError.message}`);
  }

  if (primaryUri !== LOCAL_MONGO_URI) {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect cleanup issues before retrying local MongoDB.
    }

    try {
      await tryConnectMongo(LOCAL_MONGO_URI, 'local MongoDB');
      return;
    } catch (fallbackError) {
      console.error(`Local MongoDB fallback failed: ${fallbackError.message}`);
    }
  }

  app.locals.dbStatus = {
    connected: false,
    uri: null,
    message: 'Database unavailable. Add your IP to MongoDB Atlas or start a local MongoDB server on 127.0.0.1:27017.',
  };
};

void connectDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/services', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Smart Crop Advisory API is running',
    database: app.locals.dbStatus,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
