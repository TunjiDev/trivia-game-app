const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Please provide a question!'],
        unique: true
    },
    category: {
        type: String,
        default: 'football'
    },
    options: [
        {
            optionA: {
                type: String,
                required: true
            },
            optionB: {
                type: String,
                required: true
            },
            optionC: {
                type: String,
                required: true
            }
        }
    ],
    answer: {
        type: String,
        required: [true, 'A question must have an answer!']
    },
    difficulty: {
        type: String,
        required: [true, 'A question must have a difficulty!'],
        enum: {
            values: ['easy', 'average', 'hard'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    playCount: {
        type: Number,
        default: 0
    },
    submitttedBy: {
        type: String
    },
    approvedBy: {
        type: String
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;