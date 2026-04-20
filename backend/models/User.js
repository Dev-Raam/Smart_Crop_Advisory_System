import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: 'en' },
  location: {
    lat: { type: Number },
    lon: { type: Number },
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
