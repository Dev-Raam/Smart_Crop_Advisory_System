import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import {
  chatWithAssistant,
  deleteHistoryEntry,
  detectDisease,
  getHistory,
  recommendCrop,
} from '../controllers/serviceController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
router.post('/recommend-crop', auth, recommendCrop);
router.post('/detect-disease', auth, upload.single('image'), detectDisease);
router.post('/chat', auth, chatWithAssistant);
router.get('/history', auth, getHistory);
router.delete('/history/:id', auth, deleteHistoryEntry);

export default router;
