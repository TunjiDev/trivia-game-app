const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
    minLength: [14, `Invalid phone number use "+2349012345678" Format`],
    maxLength: [14, `Invalid phone number use "+2349012345678" Format`]
  },
  verificationCode: {
    type: String,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    unique: true,
  },
  profilePicture: { type: String },
  role: {
    type: String,
    default: 'user'
  },
  createdAt: Date,
  verfiedAt: Date
});

const User = mongoose.model('user', userSchema);

module.exports = User;
