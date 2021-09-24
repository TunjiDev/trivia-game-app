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
    type: String,
    unique: true
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
    default: 15
  },
  extraLives: {
    type: Number,
    default: 15
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
  activeGames: [], //This would eventually contain an object with the livegame Id and game time
  currentGame: [], //This would eventually contain an object with the current game Id, questionTimer,  eraser, extralife, gamestatus.
  currentQuestion: {
    type: Number,
    default: -1
  },
  questionsTimer: {
      type: Number,
      default: 0
  },
  previousQuestion: {
    type: Number,
    default: -1
  },
  gameInit: {
      type: Boolean,
      default: false //Set to true once gAME HAS OFFICIALLY STARTED
  },
  gameEnded: {
      type: Boolean,
      default: false
  }
}, {timestamps: true});

const User = mongoose.model('user', userSchema);

module.exports = User;