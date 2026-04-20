import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getProfile,
  loginUser,
  registerUser,
  updateProfile,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
