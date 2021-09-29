const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/appError");
const User = require("../models/userModel");
const Instantgame = require("../models/instantgameModel");
const APIFeatures = require("../../utils/apiFeatures");
const Question = require('../models/questionModel');

exports.joinInstantGame = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    const instantgame = await Instantgame.findOne({
        categoryName: req.body.categoryName,
        stake: req.body.stake
    });

    if (!instantgame) {
        const newInstantGame = await Instantgame.create({
            categoryName: req.body.categoryName,
            stake: req.body.stake
        });
    }

    if (!req.body.createdBy) req.body.createdBy = user.id;
  
    const fourEasyQuestions = await Question.aggregate([
        {
            $match: {category: `${req.body.categoryName}`},
        },
        {
            $match: {difficulty: 'easy'}
        },
        {
            $match: {active: true}
        },
        {
            $sample: {size: 4}
        }
    ]);
  
    const threeAverageQuestions = await Question.aggregate([
        {
            $match: {category: `${req.body.categoryName}`},
        },
        {
            $match: {difficulty: 'average'}
        },
        {
            $match: {active: true}
        },
        {
            $sample: {size: 3}
        }
    ]);
  
    const threeHardQuestions = await Question.aggregate([
        {
            $match: {category: `${req.body.categoryName}`},
        },
        {
            $match: {difficulty: 'hard'}
        },
        {
            $match: {active: true}
        },
        {
            $sample: {size: 3}
        }
    ]);
  
    const mergedResults = [...fourEasyQuestions, ...threeAverageQuestions, ...threeHardQuestions];
  
    let newLiveGame;
  
    if(gameTime >= DateA && gameTime < futureDateB) {
        if (mergedResults.length >= 10) {
            newLiveGame = await Livegame.create({
            categoryName: req.body.categoryName,
            gameTime,
            entryFee: req.body.entryFee,
            reward: req.body.reward,
            createdBy: req.body.createdBy
            });
        
            categoryName = newLiveGame.categoryName;
        } else { 
            return next(new AppError('This category either doesn\'t exist or it doesn\'t have enough questions. Please pick another category.', 400));
        }
        } else{
            return next(new AppError('Game time must be at least one hour in the future and also not above 7 days.', 400));
        }
  
    newLiveGame.questions = mergedResults;
  
    await newLiveGame.save();
  
    res.status(200).json({
        status: 'success',
        data: {
            newLiveGame
        }
    });
});