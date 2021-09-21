const mongoose = require('mongoose');

const instantgameSchema = new mongooose.Schema({
    categoryName: {
        type: String,
        required: [true, 'An instant game must have a category name'],
        lowercase: true
    },
    player1: String,
    player2: String,
    stake: {
        type: Number,
        default: 5000
    },
    questions: Array,
    gameType: {
        type: String,
        lowercase: true,
        enum: ['online', 'friend']
    },
    winner: String,
    Stats: Number
});

const Instantgame = mongoose.model('Instantgame', instantgameSchema);
module.exports = Instantgame;