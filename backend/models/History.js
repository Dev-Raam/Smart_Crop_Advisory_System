import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['crop_recommendation', 'disease_detection', 'chat'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // Store flexible data based on type
}, { timestamps: true });

export default mongoose.model('History', historySchema);
