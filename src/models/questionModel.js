const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please provide a question!'],
      unique: true
    },
    category: {
        type: String,
        required: [true, 'Question must belong to a category'],
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
    submittedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
      required: [true, 'Question must be created and submitted by someone!']
    },
    approvedBy: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

questionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'submittedBy',
        select: 'name'
    });
    next();
});

//Hashing the answer
questionSchema.pre('save', async function(next) {
  //Only run this funtion is password was actually modified
  if (!this.isModified('answer')) return next();

  //Hash the answer with cost of 12
  this.answer = await bcrypt.hash(this.answer, 12);
  next();
});

questionSchema.index({ difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
