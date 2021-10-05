const mongoose = require('mongoose');

const instantgameSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: [true, 'An instant game must have a category name'],
        lowercase: true
    },
    players: [String],
    activePlayers: [String],
    stake: {
        type: Number,
        required: [true, 'An instant game must have a stake!']
    },
    questions: Array,
    // gameType: {
    //     type: String,
    //     lowercase: true,
    //     enum: ['online', 'friend']
    // },
    winner: String,
    Stats: Number,
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: [true, 'An instant game must be created by someone']
    }
}, {timestamps: true});

instantgameSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'createdBy',
        select: 'username'
    });
    next();
});

const Instantgame = mongoose.model('Instantgame', instantgameSchema);
module.exports = Instantgame;