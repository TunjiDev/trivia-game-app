const mongoose = require('mongoose');
const Question = require('./questionModel');

const livegameSchema = new mongoose.Schema({
    categoryName: { 
        type: String,
        required: [true, 'A live game must have a category name'],
        unique: true
    },
    gameTime: {
        type: Date,
        default: Date.now(),
        required: true
    },
    entryFee: { 
        type: Number,
        required: true
    },
    participants: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
    activeParticipants: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
    questions: Array,
    reward: {
        type: Number,
        required: true
    },
    activeStatus: {
        type: Boolean,
        default: false
    },
    shares: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
    currentQuestion: {
        type: Number,
        default: -1
    },
    questionsTimer: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Admin'
    }
}, {timestamps: true});

livegameSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'createdBy',
        select: 'name'
    });
    next();
});

const Livegame = mongoose.model('Livegame', livegameSchema);
module.exports = Livegame;