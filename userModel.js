const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide your username!'],
    unique: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide your phone number!'],
    unique: [true, 'Cannot have multiple account with same number']
    // minlength: 11,
    // maxlength: 11
  },
  password: {
    type: String,
    required: [true, 'Please provide your password!'],
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
    // select: false
  },
  verificationCode: {
    type: String,
    required: false
  },
  posts: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Post'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

//Hashing the password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
});

//FOR LOGGING IN: Checking if the inputted password matches that in the database
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
