const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  verificationCode: { type: String },
  username: { type: String },
  profilePicture: { type: String },
  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.model("user", userSchema);

module.exports = User;
