const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for this category'],
      unique: true,
      lowercase: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Category must be created by someone!']
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
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ]
  },
  { timestamps: true , versionKey:false},
);

categorySchema.pre(/^find/,  function(next) {
  this.populate({ path: 'questions' });
  this.populate({
    path: 'createdBy',
    select: 'name'
  });

  this.questionCount = this.questions?.length;

  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
