import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_EXPIRES_IN = '30d';

const isDatabaseReady = () => User.db.readyState === 1;

const normalizePhone = (phone) => String(phone || '').replace(/\D+/g, '').trim();

const normalizeName = (name) => String(name || '').trim();

const buildUserResponse = (user) => ({
  ...buildAuthPayload(user),
  location: user.location,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildAuthPayload = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  language: user.language,
});

const signToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
};

const handleAuthError = (res, err) => {
  if (err?.code === 11000) {
    return res.status(400).json({ message: 'An account with this phone number already exists.' });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: 'Please enter valid registration details.' });
  }

  console.error('Auth error:', err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

export const registerUser = async (req, res) => {
  try {
    const { password, language } = req.body;
    const name = normalizeName(req.body.name);
    const rawPhone = String(req.body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const normalizedPassword = String(password || '').trim();

    if (!isDatabaseReady()) {
      return res.status(503).json({ message: 'Database is not connected. Please try again in a moment.' });
    }

    if (!name || !phone || !normalizedPassword) {
      return res.status(400).json({ message: 'Not all fields have been entered.' });
    }

    if (phone.length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    const existingUser = await User.findOne({
      $or: [{ phone }, { phone: rawPhone }],
    });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(normalizedPassword, salt);

    const savedUser = await User.create({
      name,
      phone,
      password: passwordHash,
      language: language || 'en',
    });

    return res.status(201).json({
      token: signToken(savedUser._id),
      user: buildUserResponse(savedUser),
    });
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const loginUser = async (req, res) => {
  try {
    const rawPhone = String(req.body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const password = String(req.body.password || '').trim();

    if (!phone || !password) {
      return res.status(400).json({ message: 'Not all fields have been entered.' });
    }

    if (!isDatabaseReady()) {
      return res.status(503).json({ message: 'Database is not connected. Please try again in a moment.' });
    }

    const user = await User.findOne({
      $or: [{ phone }, { phone: rawPhone }],
    });
    if (!user) {
      return res.status(400).json({ message: 'No account with this phone number has been registered.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    return res.json({
      token: signToken(user._id),
      user: buildUserResponse(user),
    });
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    return res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ message: 'Unable to load profile right now.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, language, location } = req.body;
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (language) user.language = language;
    if (location) user.location = location;

    await user.save();
    return res.json(buildUserResponse(user));
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: 'Unable to update profile right now.' });
  }
};
