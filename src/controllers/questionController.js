const Question = require('../models/questionModel');
const Category = require('../models/categoryModel');
const APIFeatures = require('../../utils/apiFeatures');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');

// exports.setCategoryAdminIds = (req, res, next) => {
//     //Allow nested routes
//     if (!req.body.category) req.body.category = req.params.categoryId;
//     if (!req.body.submitttedBy) req.body.submitttedBy = req.admin.id;
//     next();
// };

exports.createQuestion = catchAsync(async (req, res, next) => {
    if (!req.body.category) req.body.category = req.params.categoryName;
    if (!req.body.submitttedBy) req.body.submitttedBy = req.admin.id;
    
    const categoryNames = await Category.find().distinct('name');

    if (!categoryNames.includes(req.body.category)) {
        return next(new AppError('The category for this question does not exist. Please pick another category.', 400));
    } else {
        // const questionCount = await Question.aggregate([
        //     {
        //         $match: {category: `${req.body.category}`}
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             numQuestions: {$sum: 1}
        //         }
        //     }
        // ]);
        const newQuestion = await Question.create(req.body);
        const allQuestionsInASpecificCategory = await Question.find({category: `${req.body.category}`});
        console.log(allQuestionsInASpecificCategory.length);

        await Category.findOneAndUpdate({name: `${req.body.category}`}, {questionCount: allQuestionsInASpecificCategory.length}, {runValidators: true});
        res.status(201).json({
            status: 'success',
            data: {
                question: newQuestion
            }
        });
    }
});

exports.getAllQuestions = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.categoryName) filter = {category: req.params.categoryName};

    const features = new APIFeatures(Question.find(filter), req.query)
        .filter()
        .sort()
        .paginate();

    const questions = await features.query;

    res.status(200).json({
        status: 'success',
        results: questions.length,
        data: {
            questions
        }
    });
});

exports.getQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findById(req.params.id)
        .populate({path: 'submitttedBy', select: 'name'});

    if (!question) return next(new AppError('No Question found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: {
            question
        }
    });
});

exports.updateQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!question) return next(new AppError('No Question found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: {
            question
        }
    });
});

exports.deleteQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) return next(new AppError('No Question found with that ID', 404));

    res.status(204).json({
        status: 'success',
        data: null
    });
});