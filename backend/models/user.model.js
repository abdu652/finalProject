import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  password: String,
  phone: String,
  email: String,
  salary: Number,
  role: {
    type: String,
    enum: ['admin', 'worker', 'manager'],
    default: 'worker'
  },
  status: {
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  assignments: [{
    manholeId: String,
    task: String,
    date: Date
  }]
});

export default mongoose.model('User', userSchema);