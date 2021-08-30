const mongoose = require('mongoose');
const Question = require('./questionModel');

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
    questions: Array
  },
  { timestamps: true , versionKey:false},
);

// categorySchema.pre(/^find/, async function(next) {
//   console.log(this);
//   // this.questionCount = this.questions.length;
//     // const categoriesPromises = this.questions.map(async (id) => await Question.findById(id));
//     // this.questions = await Promise.all(categoriesPromises);
//   // this.populate({ path: 'questions' });
//   // this.populate({
//   //   path: 'createdBy',
//   //   select: 'name'
//   // });
//   next();
// });

categorySchema.pre(/^find/,  function(next) {
  // console.log(this.schema.obj.questionCount);
  this.populate({
    path: 'createdBy',
    select: 'name'
  });

  // this.schema.obj.questionCount = this.schema.obj.questions?.length;

  next();
});
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
