const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/appError");
const User = require("../models/userModel");
const Livegamedemo = require("../models/livegameDEMOModel");
const APIFeatures = require("../../utils/apiFeatures");
const Question = require('../models/questionModel');

//========================== FOR ADMINS =============================
exports.createLiveGame = catchAsync(async (req, res, next) => {
    if (!req.body.createdBy) req.body.createdBy = req.admin.id;
    
    let gameTime = Date.parse(req.body.gameTime);
  
    let DateA = Date.parse(new Date()) + 3600000;  //1 hour in the future
    let futureDateB = Date.parse(new Date()) + 604800000; //7 days in future
  
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
            newLiveGame = await Livegamedemo.create({
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
  
exports.getAllLiveGames = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Livegamedemo.find(), req.query)
        .filter()
        .sort()
        .paginate();
  
    const livegames = await features.query;
  
    res.status(200).json({
        status: 'success',
        results: livegames.length,
        data: {
            livegames
        }
    });
});
  
exports.getLivegame = catchAsync(async (req, res, next) => {
    const livegame = await Livegamedemo.findById(req.params.id);
  
    if (!livegame) return next(new AppError('No Livegame found with that ID', 404));
  
    res.status(200).json({
        status: 'success',
        data: {
            livegame
        }
    });
});
  
exports.updateLivegame = catchAsync(async (req, res, next) => {
    const livegame = await Livegamedemo.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
  
    if (req.body.gameTime) {
      livegame.gameTime = Date.parse(req.body.gameTime);
      await livegame.save();
    }
  
    if (!livegame) return next(new AppError('No Livegame found with that ID', 404));
  
    res.status(200).json({
        status: 'success',
        data: {
            livegame
        }
    });
});
  
exports.deleteLiveGame = catchAsync(async (req, res, next) => {
    const livegame = await Livegamedemo.findByIdAndDelete(req.params.id);
  
    if (!livegame) return next(new AppError('No livegame found with that ID', 404));
  
    res.status(204).json({
        status: 'success',
        data: null
    });
});

//========================== FOR USERS =============================
exports.getAllLiveGames = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Livegamedemo.find(), req.query)
      .filter()
      .sort()
      .paginate();
  
    const livegames = await features.query;
  
    res.status(200).json({
        status: "success",
        results: livegames.length,
        data: {
            livegames,
        },
    });
});
  
exports.joinLiveGame = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const livegame = await Livegamedemo.findOne({
        categoryName: req.body.categoryName,
    });
    const twoMinsToGameTime = +livegame.gameTime - 120000;
    const twentyMinsAfterCurrentTime = Date.parse(new Date()) + 1200000;
    const currentTime = Date.parse(new Date());
  
    // 1) Check if game is active.
    if (!livegame.activeStatus) {
        return next(
            new AppError(
            "You can't join this game now because it is not yet active!",
            400
            )
        );
    }
  
    // Check if gametime is NOT two minutes or less to the start of the game
    if (currentTime >= twoMinsToGameTime) {
        return next(
            new AppError(
            "The time for joining this game has passed, Please join another live game",
            400
            )
        );
    }
  
    if (livegame.participants.includes(req.user._id)) {
        return next(new AppError("You have already joined this game!", 400));
    }
  
    //////// ******** Will come back to check this ******** \\\\\\\\\\\\\\\\
  
    // 3) Check if a game the user had already joined won't start in 20mins
    let activeGametimeArr = [];
    //pushed all gametimes into the new array above
    user.activeGames.forEach((el) => {
        activeGametimeArr.push(el.gameTime);
    });
  
    const willStartInTwentyMinsOrLess = activeGametimeArr.some(
        (el) => el >= currentTime && el <= twentyMinsAfterCurrentTime
    );
    if (willStartInTwentyMinsOrLess) {
        return next(
            new AppError(
            "You have already joined a game that will begin in 20 minutes or less",
            400
            )
        );
    }
  
    // 4) Check if they have enough coins to join the game
    if (req.user.coins < livegame.entryFee) {
        return next(
            new AppError("You do not have enough coins to join this game!", 400)
        );
    }
  
    // 5) Push the user's ID in the game participants
    livegame.participants.push(req.user._id);
  
    // 6) Insert the game's category ID and game time in the activeGames field of the user's model
    let objectForActiveGames = {
        categoryId: livegame._id,
        gameTime: livegame.gameTime,
    };
  
    user.activeGames.push(objectForActiveGames);
  
    // 7) Debit the coin of the user
    user.coins = user.coins - livegame.entryFee;
  
    await livegame.save();
    await user.save();
  
    res.status(200).json({
        status: "success",
        message: "You have successfully joined this live game!",
    });
  });
  
//========================== GAME ZONE(STILL FOR USERS) =============================
exports.gameZone = catchAsync(async (req, res, next) => {
    const livegame = await Livegamedemo.findById(req.body.gameId);
    const user = await User.findById(req.user.id);
    const answer = req.body.answer;
    const action = req.body.action;
    const currentTime = Date.parse(new Date());
    const twoMinsToGameTime = +livegame.gameTime - 120000;
    const timer = +livegame.gameTime + 30000;
  
    //******************************************* */
    // **** GAME ZONE: STEP 1
    // **** Check if game is active & initialize the game. This should only occur once
    // 1) With the gameId, check if game is active. (Check if time and status is active)
    if (currentTime >= twoMinsToGameTime && livegame.activeStatus && !livegame.gameInit) {
        // 2) Check if user is a participant in the game
        if (!livegame.participants.includes(req.user._id)) {
            return next(new AppError("You are not a participant in this game!", 400));
        }
    
        // Add the participant's Ids to the active participant's array
        if (!livegame.activeParticipants.includes(req.user._id)) {
            livegame.activeParticipants.push(req.user._id);
            await livegame.save();
        }
    
        // 3) Make the Id of the game the current game Id in the user's model
        let objectForcurrentGame = {
            currentGameId: livegame._id,
            timer: livegame.questionsTimer,
            eraser: user.erasers,
            extraLife: user.extraLives,
            gameStatus: livegame.activeStatus,
        };
    
        user.currentGame.push(objectForcurrentGame);
    
        /// STAR 1: **** Since this is true, I removed the other instance of this below in (INSTANCE 1). the two will both be true thereby causing error
        // check if it's now time for the game to be played.
        // If yes, do nothing....
        if (currentTime < +livegame.gameTime) {
            console.log("1. Taken to game zone");
            res.status(200).json({
                status: "success",
                message: "You have been taken to the game zone.",
            });
        }
        //INITIALIZING GAME
        if (currentTime >= +livegame.gameTime && !livegame.gameInit) {
            // 4) Set current question to 0
            livegame.currentQuestion = 0;
    
            // 5) Set questions timer to 30 seconds.
            livegame.questionsTimer = timer;
    
            livegame.gameInit = true;
    
            await livegame.save();
            await user.save();
    
            console.log("2. Game Initialized");
        }
    }
    // INSTANCE 1
    // This should not be there. Because of the reasons in STAR 1.
    // So it has been commented out
    // else if (currentTime < livegame.gameTime) {
    //   console.log("3");
    //   res.status(200).json({
    //     status: "success",
    //     message: "The game hasn't started yet.",
    //   });
    // }
  
    //******************************************* */
    // GAME ZONE: STEP 3
    //MOVING TO THE NEXT QUESTION
    if (livegame.gameInit && currentTime >= +livegame.gameTime && livegame.activeStatus && currentTime > livegame.questionsTimer && !answer && !action && !livegame.gameEnded) {
        // Increment question state by 1
        livegame.currentQuestion = livegame.currentQuestion + 1;
        // Set questions timer to 30 seconds.
        livegame.questionsTimer = livegame.questionsTimer + 30000;
    
        await livegame.save();
        
        if (livegame.currentQuestion > 8) {
            livegame.gameEnded = true;
    
            await livegame.save();
        }
    
        console.log("4. Moved to Next question")
        res.status(200).json({
            status: "success",
            question: livegame.questions[livegame.currentQuestion].question,
            options: livegame.questions[livegame.currentQuestion].options,
            message: "Next Question."
        });
        // console.log("4");
        // console.log(currentTime);
        // console.log(livegame.questionsTimer);
    }
  
    
    //******************************************* */
    // GAME ZONE: STEP 2
    //GET THE QUESTIONS
    if (livegame.gameInit && currentTime >= +livegame.gameTime && currentTime < livegame.questionsTimer && livegame.activeStatus && !answer && !action && livegame.currentQuestion > livegame.previousQuestion) {
        // Check if user is a participant in the game
        if (!livegame.participants.includes(req.user._id)) {
            return next(new AppError("You are not a participant in this game!", 400));
        }
    
        livegame.previousQuestion = livegame.previousQuestion + 1;
    
        await livegame.save();
    
        console.log("3. question returned");
        res.status(200).json({
            status: "success",
            question: livegame.questions[livegame.currentQuestion].question,
            options: livegame.questions[livegame.currentQuestion].options,
            message: "Question has been returned"
        });
    } else if (livegame.gameInit && currentTime >= +livegame.gameTime && currentTime < livegame.questionsTimer && livegame.activeStatus && !answer && !action && livegame.currentQuestion <= livegame.previousQuestion) {
        res.status(200).json({
            status: "success",
            message: "Wait for next question!"
        });
    }
  
    //******************************************* */
    // GAME ZONE: STEP 4
    //SUBMITTING ANSWERS
    // comment out currentTime < livegame.questionsTimer when testing
    if (livegame.gameInit && currentTime >= +livegame.gameTime && currentTime < livegame.questionsTimer && livegame.activeStatus && answer && !action) {
        // Check if user is a participant in the game in the first place
        if (!livegame.participants.includes(req.user._id)) {
            return next(new AppError("You are not a participant in this game!", 400));
        }
    
        /// Check if user is still an active participant
        if (!livegame.activeParticipants.includes(req.user._id)) {
            return next(
                new AppError(
                    "You have failed a question and no longer a participant in this game!",
                    400
                )
            );
        }
    
        //Remove user from game if they get the answer wrong
        if (answer !== livegame.questions[livegame.currentQuestion].answer) {
            const userIndex = livegame.activeParticipants.indexOf(req.user._id);
            livegame.activeParticipants.splice(userIndex, 1);
            await livegame.save();
        }
    
        console.log("5. Answer submitted");
        // console.log(currentTime);
        // console.log(livegame.questionsTimer);
    
        res.status(200).json({
            status: "success",
            timer: livegame.questionsTimer,
            message:
            answer == livegame.questions[livegame.currentQuestion].answer
                ? "Correct!"
                : "Wrong!",
        });
    } else if (livegame.gameInit && currentTime >= +livegame.gameTime && currentTime > livegame.questionsTimer && livegame.activeStatus && answer && !action) {
            // console.log(currentTime);
            // console.log(livegame.questionsTimer);
            console.log("6. Problem with answer")
            res.status(200).json({
                status: "success",
                message: "Time up! cannot submit ths answer...."
            });
        }
  
    // GAME ZONE: STEP 5
    //IF EXTRALIFE OR ERASER IS BEING USED
    if (livegame.gameInit && currentTime >= +livegame.gameTime && /*currentTime < livegame.questionsTimer && */livegame.activeStatus && !answer && action) {
        // Check if user is a participant in the game
        if (!livegame.participants.includes(req.user._id)) {
            return next(new AppError("You are not a participant in this game!", 400));
        }
    
        ///// INSTANCE 3: ERASER does not put the user back into the game. It only removes one wrong answer. But this one can be fixed later.
        ///// INSTANCE 4: I changed it from checking if the eraser and extralives != 0 to > 0. They can only use erasers if they have at least one.
        // Check if it's eraser that's being used
        if (user.erasers > 0 && action === "eraser") {
                user.eraser = user.eraser - 1;
                await user.save();
        
            console.log("6");
            res.status(200).json({
                status: "success",
                question: livegame.questions[livegame.currentQuestion].question,
                options: livegame.questions[livegame.currentQuestion].options,
                answer: livegame.questions[livegame.currentQuestion].answer,
                message: "Question has been returned"
            });
        }
        // Check if the user is using extra life
        else if (user.extraLives > 0 && action === "extralife") {
            if (!livegame.activeParticipants.includes(req.user._id)) {
                livegame.activeParticipants.push(req.user._id);
                await livegame.save();
            }
            user.extraLives = user.extraLives - 1;
    
            await user.save();
    
            // console.log(livegame.activeParticipants);
            // console.log("extralife used");
            // console.log(action);
            // console.log(user.extraLives);
    
            res.status(200).json({
                status: "success",
                question: livegame.questions[livegame.currentQuestion + 1].question,
                options: livegame.questions[livegame.currentQuestion + 1].options,
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
  
      // GAME ZONE: STEP 6
      //SPLIT THE MONEY(REWARD IN THE LIVEGAME MODEL) AMONGST THE REMAINING ACTIVE PARTICIPANTS
    if (livegame.gameEnded && currentTime >= +livegame.gameTime && livegame.gameInit && livegame.activeStatus && currentTime > livegame.questionsTimer && !answer) {
        // Check if user is a participant in the game
        if (!livegame.participants.includes(req.user._id)) {
            return next(new AppError("You are not a participant in this game!", 400));
        }
        // Check if user is still an active participant
        if (!livegame.activeParticipants.includes(req.user._id)) {
            return next(new AppError("You have failed a question and are no longer a participant in this game!", 400));
        }
        const moneyWon = livegame.reward / livegame.activeParticipants.length;
    
        user.earnings = user.earnings + moneyWon;
    
        await user.save();
    
        console.log("9");
        res.status(200).json({
            status: "success",
            message: `Congrats! You have won ₦${moneyWon} naira!`
        });
    }
  
    // GAME ZONE: STEP 7
    // After game has ended and users have won their money, set active status back to false
    // if (livegame.gameEnded && livegame.gameTime >= fifteenMinsAfterGameTime) {
    //   livegame.activeStatus = false;
  
    //   await livegame.save();
    // }
});