const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/appError");
const User = require("../models/userModel");
const Instantgame = require("../models/instantgameModel");
const APIFeatures = require("../../utils/apiFeatures");
const Question = require('../models/questionModel');

exports.playInstantGame = catchAsync(async (req, res, next) => {
    // const user = await User.findById(req.user._id);
    if (!req.body.createdBy) req.body.createdBy = req.user._id;
  
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
  
    const instantgame = await Instantgame.findOne({
        categoryName: req.body.categoryName,
        stake: req.body.stake
    });

    if (!instantgame) {
        if (mergedResults.length >= 10) {
            const newInstantGame = await Instantgame.create({
                categoryName: req.body.categoryName,
                stake: req.body.stake,
                questions: mergedResults,
                createdBy: req.body.createdBy
            });

            newInstantGame.players.push(req.user._id);
            await newInstantGame.save();
            
            res.status(200).json({
                status: 'success',
                message: 'Instant Game successfully created!',
                data: {
                    newInstantGame
                }
            });
        } else {
            return next(new AppError('This category either doesn\'t exist or it doesn\'t have enough questions. Please pick another category.', 400));
        }
    } else {
        const availableInstantGame = await Instantgame.findOne({
            categoryName: req.body.categoryName,
            stake: req.body.stake
        });

        if (availableInstantGame.players.includes(req.user._id)) {
            return next(new AppError('You cannot join your own game!', 400));
        } else {
            availableInstantGame.players.push(req.user._id);
            await availableInstantGame.save();
        }
                    
        res.status(200).json({
            status: 'success',
            message: 'You have successfully joined an instant game!',
            data: {
                availableInstantGame
            }
        });
    }
});

exports.getAllInstantGames = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Instantgame.find(), req.query)
        .filter()
        .sort()
        .paginate();

    const instantgames = await features.query;
  
    res.status(200).json({
        status: 'success',
        results: instantgames.length,
        data: {
            instantgames
        }
    });
});

exports.gameZone = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const answer = req.body.answer;
    const action = req.body.action;
    // const currentTime = Date.parse(new Date());

    // const instantgames = await Instantgame.find({ players: { $size: 2} });
    // const instantGame = await Instantgame.find({ players: `${req.user.id}`});
    // CHECK ALL GAMES WHICH PLAYER'S ARRAY LENGTH IS EQUAL TO 2 AND THE PLAYER'S ID IS INSIDE THE ARRAY
    const instantGame = await Instantgame.aggregate([
        {
            $match: {players: {$size: 2} }
        },
        {
            $match: {players: `${req.user._id}` }
        }
    ]);

    // console.log(instantGame[0].players);

    // res.status(200).json({
    //     status: 'success',
    //     results: instantGame.length,
    //     data: {
    //         instantGame
    //     }
    // });

    if (instantGame) {
        //INITIALIZING GAME
        if (!user.gameInit) {
            user.currentQuestion = 0;
    
            user.gameInit = true;

            await user.save();
    
            console.log("2. Game Initialized");
        }

        //MOVING TO THE NEXT QUESTION
        if (user.gameInit && !answer && !action && !user.gameEnded) {

            user.currentQuestion = user.currentQuestion + 1;
    
            await user.save();
            
            if (user.currentQuestion > 8) {
                user.gameEnded = true;
        
                await user.save();
            }
        
            console.log("4. Moved to Next question");
            // console.log(instantGame[0].questions);
            // console.log(instantGame[0]);
    
            res.status(200).json({
                status: "success",
                question: instantGame[0].questions[user.currentQuestion].question,
                options: instantGame[0].questions[user.currentQuestion].options,
                message: "Next Question."
            });
        }

        //GET THE QUESTIONS
        if (user.gameInit && !answer && !action && user.currentQuestion > user.previousQuestion) {
        
            user.previousQuestion = user.previousQuestion + 1;
        
            await user.save();
        
            console.log("3. question returned");

            res.status(200).json({
                status: "success",
                question: instantGame[0].questions[user.currentQuestion].question,
                options: instantGame[0].questions[user.currentQuestion].options,
                message: "Question has been returned"
            });
        } else if (user.gameInit && !answer && !action && user.currentQuestion <= user.previousQuestion) {
            res.status(200).json({
                status: "success",
                message: "Wait for next question!"
            });
        }

        //SUBMITTING ANSWERS
        if (user.gameInit && answer && !action) {
            if (!(instantGame[0].players.includes(req.user._id))) {
                // return next(new AppError("You have failed a question and no longer a participant in this game!", 400));
                console.log("You have failed a question and no longer a participant in this game");
            }
        
            //Remove user from game if they get the answer wrong
            if (answer !== instantGame[0].questions[user.currentQuestion].answer) {
                const userIndex = instantGame[0].players.indexOf(req.user._id);
                instantGame[0].players.splice(userIndex, 1);
                await instantGame[0].save();
            }
        
            console.log("5. Answer submitted");
            console.log(instantGame[0].players);
            console.log(instantGame[0].players.includes(req.user._id));
            console.log(typeof(req.user._id));
        
            res.status(200).json({
                status: "success",
                timer: user.questionsTimer,
                message:
                answer == instantGame[0].questions[user.currentQuestion].answer ? "Correct!" : "Wrong!",
            });
        }

        //IF EXTRALIFE OR ERASER IS BEING USED
        if (user.gameInit && !answer && action) {

            // Check if it's eraser that's being used
            if (user.erasers > 0 && action === "eraser") {
                    user.erasers = user.erasers - 1;
                    await user.save();
            
                console.log("6");
                res.status(200).json({
                    status: "success",
                    question: instantGame[0].questions[user.currentQuestion].question,
                    options: instantGame[0].questions[user.currentQuestion].options,
                    answer: instantGame[0].questions[user.currentQuestion].answer,
                    message: "Question has been returned"
                });
            }
            // Check if the user is using extra life
            else if (user.extraLives > 0 && action === "extralife") {
                if (!instantGame[0].players.includes(req.user._id)) {
                    instantGame[0].players.push(req.user._id);
                    await instantGame[0].save();
                }
                user.extraLives = user.extraLives - 1;
        
                user.currentQuestion = user.currentQuestion + 1;

                user.previousQuestion = user.previousQuestion + 1;

                await user.save();

                console.log('extralife used');
                res.status(200).json({
                    status: "success",
                    question: instantGame[0].questions[user.currentQuestion].question,
                    options: instantGame[0].questions[user.currentQuestion].options,
                    message: "You have used an extralife and have been taken to the next question"
                });
            } else {
                console.log("7");
                res.status(200).json({
                    status: "success",
                    message: "Sorry, you do not have enough erasers or extralives.",
                });
            }
        
            console.log("8");
        }

        //SPLIT THE MONEY(REWARD IN THE instantGame MODEL) AMONGST THE REMAINING ACTIVE PARTICIPANTS
        if (user.gameEnded && !user.moneyWon && user.gameInit && !answer) {
            if (!instantGame[0].players.includes(req.user._id)) {
                return next(new AppError("You have failed a question and are no longer a participant in this game!", 400));
            }
            const moneyWon = (instantGame[0].stake * 2) / instantGame[0].players.length;
        
            user.earnings = user.earnings + moneyWon;

            //RESETTING THE USER STATE AND REMOVING THEM FROM THE instantGame AFTER GAME HAS ENDED AND MONEY HAS BEEN SHARED
            user.currentQuestion = -1;
            user.previousQuestion = -1;
            user.gameEnded = false;
            user.gameInit = false;
        
            await user.save();
            // await instantGame.save();
        
            console.log("9");
            res.status(200).json({
                status: "success",
                message: `Congrats! You have won ₦${moneyWon} naira!`
            });
        }
    }
});