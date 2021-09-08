const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    type: String
  },
  profilePicture: { 
    type: String 
  },
  role: {
    type: String,
    default: 'user'
  },
  verfiedAt: Date,
  lastSeen: {
    type: Date,
    default: Date.now()
  },
  coins: {
    type: Number,
    default: 50000
  },
  erasers: {
    type: Number,
    default: 0
  },
  extraLives: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  bankAccount: {
    type: Number
  },
  bankName: {
    type: String
  },
  activeGames: []
}, {timestamps: true});

const User = mongoose.model('user', userSchema);

module.exports = User;