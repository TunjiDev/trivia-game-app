const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: [true, 'Cannot create with multiple Phone'],
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
  profilePicture: { type: String },
  role: {
    type: String,
    default: 'user'
  }
});

const User = mongoose.model('user', userSchema);

module.exports = User;
