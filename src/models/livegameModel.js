const mongoose = require('mongoose');

const livegameSchema = new mongoose.Schema({
    categoryName: { 
        type: String,
        required: [true, 'A live game must have a category name'],
        lowercase: true
    },
    gameTime: {
        type: String,
        required: true
    },
    entryFee: { 
        type: Number,
        required: true
    },
    participants: [],
    activeParticipants: [],
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
    questionsTimer: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Admin',
        required: [true, 'A Live game must be created by someone']
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

livegameSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'createdBy',
        select: 'name'
    });
    next();
});

livegameSchema.pre(/^find/, function(next) {
    this.find({activeStatus : {$ne: false}});
    // this.find({gameTime: {$gt: Date.parse(new Date())}});

    next();
});

const Livegame = mongoose.model('Livegame', livegameSchema);
module.exports = Livegame;