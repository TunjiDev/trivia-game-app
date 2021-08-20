const Question = require('../models/questionModel');
const APIFeatures = require('../../utils/apiFeatures');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');

exports.createQuestion = catchAsync(async (req, res, next) => {
    const newQuestion = await Question.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            question: newQuestion
        }
    });
});

exports.getAllQuestions = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Question.find(), req.query)
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
    const question = await Question.findById(req.params.id);

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