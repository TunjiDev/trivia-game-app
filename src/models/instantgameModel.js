const mongoose = require('mongoose');

const instantgameModel = new mongooose.Schema({
    categoryName: {
        type: String,
        required: [true, 'An instant game must have a category name'],
        unique: true
    },
});