const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this category'],
        unique: true,
        lowercase: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    questionCount: {
        type: Number,
        default: 0
    },
    playCount: {
        type: Number,
        default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;