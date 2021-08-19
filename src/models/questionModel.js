const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Please provide a question!']
    },
    category: {
        type: String,
        default: 'football'
    },
    options: {},
    createdAt: {
      type: Date,
      default: Date.now()
    }
});