const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const User = require('../models/userModel');
const sendSms = require('../../utils/sendSms');
const crypto = require('crypto');
const authController = require('./authController');
const Livegame = require('../models/livegameModel');
const APIFeatures = require('../../utils/apiFeatures');

const generateOTP = function() {
  // 1.) generate random 4 digit statusCode
  const code = Math.floor(Math.random() * 8999 + 1000);
  // 2.)hash it

  const hash = crypto
    .createHash('md5')
    .update(`${code}`)
    .digest('hex');

  return { hash, code };
};

//========================== USER =============================
exports.getUser = catchAsync(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({ user });
});

exports.createUser = catchAsync(async (req, res, next) => {
  // 1. Get Phone number
  const rawPhone = req.body.phoneNumber.startsWith('+234');
  // 2. Validate number
  if (!rawPhone)
    return next(new AppError('Only +234 code for Nigeria is acceptable', 400));

  const userExist = await User.findOne({ phone: req.body.phoneNumber });

  const otp = generateOTP();

  // If user already exists send OTP to login
  if (userExist) {
    userExist.isVerified = false;
    userExist.verificationCode = otp.hash;
    await userExist.save();
    await sendSms(req.body.phoneNumber, `Your OTP is ${otp.code}`);

    res.status(200).json({
      status: 'success',
      message: 'OTP has been sent, Verify to proceed'
    });
  } else {
    // 3. create user with number
    const user = new User();
    user.phone = req.body.phoneNumber;
    user.verificationCode = otp.hash;
    await user.save();
    await sendSms(user.phone, `Your OTP is ${otp.code}`);

    res.status(201).json({
      status: 'success',
      message: 'OTP has been sent, Verify to proceed'
    });
  }
});

exports.verifyUser = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  // hashing
  const verificationCode = crypto
    .createHash('md5')
    .update(`${code}`)
    .digest('hex');

  const user = await User.findOneAndUpdate(
    { verificationCode },
    { isVerified: true, verificationCode: undefined, verfiedAt: Date.now() },
    { new: true }
  ).select('+verificationCode');

  if (!user) return next(new AppError('Could not verify user, Try Again', 400));

  authController.createLoginCookie(
    user,
    'Successfully verified',
    200,
    req,
    res
  );
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (!req.body.username)
    return next(new AppError('Please input username', 400));

  const user = await User.findById(req.user.id);

  user.username = req.body.username;
  user.profilePicture = req.body.profilePicture;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Username and photo has been updated',
    user
  });
});

exports.deleteUser = catchAsync(async (req, res, _next) => {
  const _user = await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Successful Deleted Record'
  });
});

//========================== LIVE GAME =============================
exports.getAllLiveGames = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Livegame.find(), req.query)
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

exports.joinLiveGame = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const livegame = await Livegame.findOne({categoryName: req.body.categoryName});
  const twoMinsToGameTime = +livegame.gameTime - 120000;
  const twentyMinsAfterCurrentTime = Date.parse(new Date()) + 1200000;
  const currentTime = Date.parse(new Date());
  
  // 1) Check if game is active.
  if (!livegame.activeStatus) {
    return next(new AppError('You can\'t join this game now because it is not yet active!', 400));
  }

  // Check if gametime is NOT two minutes or less to the start of the game
  if (currentTime >= twoMinsToGameTime) {
    return next(new AppError('The time for joining this game has passed, Please join another live game', 400));
  }

  if (livegame.participants.includes(req.user._id)) {
    return next(new AppError('You have already joined this game!', 400));
  }
  
  // 3) Check if a game the user had already joined won't start in 20mins
  let activeGametimeArr = [];
  //pushed all gametimes into the new array above
  user.activeGames.forEach((el) => {
    activeGametimeArr.push(el.gameTime);
  });

  const willStartInTwentyMinsOrLess = activeGametimeArr.some((el) => el >= currentTime && el <= twentyMinsAfterCurrentTime);
  if (willStartInTwentyMinsOrLess) {
    return next(new AppError('You have already joined a game that will begin in 20 minutes or less', 400));
  }

  // 4) Check if they have enough coins to join the game
  if (req.user.coins < livegame.entryFee) {
    return next(new AppError('You do not have enough coins to join this game!', 400));
  }
  
  // 5) Push the user's ID in the game participants
  livegame.participants.push(req.user._id);
  
  // 6) Insert the game's category ID and game time in the activeGames field of the user's model
  let objectForActiveGames = {
    categoryId: livegame._id,
    gameTime: livegame.gameTime
  };

  user.activeGames.push(objectForActiveGames);
  
  // 7) Debit the coin of the user
  user.coins = user.coins - livegame.entryFee;
  
  await livegame.save();
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'You have successfully joined this live game!'
  });
});

//========================== GAME ZONE =============================
exports.gameZone = catchAsync(async (req, res, next) => {
  const livegame = await Livegame.findById(req.body.gameId);
  const user = await User.findById(req.user.id);
  const answer = req.body.answer;
  const action = req.body.action;
  const currentTime = Date.parse(new Date());
  const twoMinsToGameTime = +livegame.gameTime - 120000;
  const timer = +livegame.gameTime + 30000;

  // 1) With the gameId, check if game is active. (Check if time and status is active)
  if (currentTime >= twoMinsToGameTime && livegame.activeStatus && !livegame.gameInit /*&& !livegame.getQuestion*/) {
    // 2) Check if user is a participant in the game
    if (!livegame.participants.includes(req.user._id)) {
      return next(new AppError('You are not a participant in this game!', 400));
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
      gameStatus: livegame.activeStatus
    };

    user.currentGame.push(objectForcurrentGame);
    
    if (currentTime < livegame.gameTime) {
      console.log('1');
      res.status(200).json({
        status: 'success',
        message: 'You have been taken to the game zone.'
      });
    }
    //INITIALIZING GAME
    if (currentTime >= livegame.gameTime && !livegame.gameInit /*&& !livegame.getQuestion*/) {
        // console.log('intializing game working')
      // 4) Set question state(current question) to 0
      livegame.currentQuestion = 0;

      // 5) Set questions timer to 30 seconds.
      livegame.questionsTimer = timer;

      livegame.gameInit = true;

      await livegame.save();
      await user.save();

      console.log('2');
      // res.status(200).json({
      //   status: 'success',
      //   message: 'The game will start now.'
      // });
    }
  } else if (currentTime < livegame.gameTime) {
    console.log('3');
    res.status(200).json({
      status: 'success',
      message: 'The game hasn\'t started yet.'
    });
  }
  
  //PLAYING THE GAME
  //GET THE QUESTIONS
  if (livegame.gameInit && currentTime < livegame.questionsTimer && !answer /*&&!livegame.getQuestion*/) {
    // livegame.getQuestion = true;
    // await livegame.save();

    if (currentTime >= livegame.gameTime && livegame.activeStatus /*&& livegame.getQuestion*/) {
  
        // Check if user is a participant in the game
        if (!livegame.participants.includes(req.user._id)) {
          return next(new AppError('You are not a participant in this game!', 400));
        }
                
        await livegame.save();
        await user.save();
    
        console.log('4');
        res.status(200).json({
          status: 'success',
          question: livegame.questions[livegame.currentQuestion].question,
          options: livegame.questions[livegame.currentQuestion].options,
          message: 'The game has started.'
        });
    }
  } else if (livegame.gameInit && currentTime > livegame.questionsTimer) {
    console.log('user removed!');
  }
      
  //MOVING TO THE NEXT QUESTION
  if (currentTime >= livegame.gameTime && livegame.gameInit && livegame.activeStatus && currentTime > livegame.questionsTimer && !answer) {
    // Set question state(current question) to 0
    livegame.currentQuestion = livegame.currentQuestion + 1;
    // Set questions timer to 30 seconds.
    livegame.questionsTimer = +livegame.gameTime + 30000;

    await livegame.save();

    res.status(200).json({
      status: 'success',
      question: livegame.questions[livegame.currentQuestion].question,
      options: livegame.questions[livegame.currentQuestion].options,
      message: 'Next Question.'
    });
    console.log('5.0');
  }

  //SUBMITTING ANSWERS
  if (livegame.gameInit && currentTime < livegame.questionsTimer && answer) {
    if (currentTime >= livegame.gameTime && livegame.activeStatus /*&&livegame.getQuestion*/) {
  
      // Check if user is a participant in the game
      if (!livegame.participants.includes(req.user._id)) {
        return next(new AppError('You are not a participant in this game!', 400));
      }
      
      if (!livegame.activeParticipants.includes(req.user._id)) {
        return next(new AppError('You have failed a question and no longer a participant in this game!', 400));
      }
      
      //Remove user from game if they get the answer wrong
      if (answer != livegame.questions[livegame.currentQuestion].answer) {
        const userIndex = livegame.activeParticipants.indexOf(req.user._id);
        livegame.activeParticipants.splice(userIndex, 1);
        await livegame.save();
      }
      

      await livegame.save();
      await user.save();
  
      console.log('5');

      res.status(200).json({
        status: 'success',
        message: (answer == livegame.questions[livegame.currentQuestion].answer) ? 'Correct!' : 'Wrong!'
      });
    }
  }

  //IF EXTRALIFE OR ERASER IS BEING USED
  if (livegame.gameInit && currentTime < livegame.questionsTimer && !answer && action) {
    if (currentTime >= livegame.gameTime && livegame.activeStatus /*&&livegame.getQuestion*/) {
  
      // Check if user is a participant in the game
      if (!livegame.participants.includes(req.user._id)) {
        return next(new AppError('You are not a participant in this game!', 400));
      }
  
      if (req.user.erasers != 0 && action == 'eraser') {
        // if (!livegame.activeParticipants.includes(req.user._id)) {
        //   livegame.activeParticipants.push(req.user._id);
        //   await livegame.save();
        // }
        req.user.eraser = req.user.eraser - 1;
        await user.save();
        
        res.status(200).json({
          status: 'success',
          question: livegame.questions[livegame.currentQuestion].question,
          options: livegame.questions[livegame.currentQuestion].options,
          message: 'Next Question.'
        });

      } else if (req.user.extraLives != 0 && action == 'extralife') {
        if (!livegame.activeParticipants.includes(req.user._id)) {
          livegame.activeParticipants.push(req.user._id);
          await livegame.save();
        }
        req.user.extraLives = req.user.extraLives - 1;
        await user.save();

      } else {
        res.status(200).json({
          status: 'success',
          message: 'Sorry, you do not have enough erasers or extralives.'
        });
      }
  
      await livegame.save();
      await user.save();
  
      console.log('6');

      res.status(200).json({
        status: 'success',
        message: (answer == livegame.questions[livegame.currentQuestion].answer) ? 'Correct!' : 'Wrong'
      });
    }
  }








  //PLAYING THE GAME
  //GET THE QUESTIONS
  // if (livegame.gameInit && currentTime < livegame.questionsTimer && !req.params.answer) {
  
  //   if (currentTime >= livegame.gameTime && livegame.activeStatus /*&& !livegame.gameInit*/) {
  
  //     // 2) Check if user is a participant in the game
  //     if (!livegame.participants.includes(req.user._id)) {
  //       return next(new AppError('You are not a participant in this game!', 400));
  //     }
     
  //     await livegame.save();
  //     await user.save();
  
  //     res.status(200).json({
  //       status: 'success',
  //       question: livegame.questions[livegame.currentQuestion].question,
  //       options: livegame.questions[livegame.currentQuestion].options,
  //       message: 'The game has started.'
  //     });
  //   }
  // } else {
  //   console.log('Displaying the questions part');
  //   return next(new AppError('This game is either not yet active or it is not yet time', 400));
  // }
  
  // //SUBMIT ANSWERS
  // if (livegame.gameInit && currentTime < livegame.questionsTimer && req.params.answer) {
  
  //   if (currentTime >= livegame.gameTime && livegame.activeStatus /*&& !livegame.gameInit*/) {
  
  //     // 2) Check if user is a participant in the game
  //     if (!livegame.participants.includes(req.user._id)) {
  //       return next(new AppError('You are not a participant in this game!', 400));
  //     }
  
  //     //Remove user from game if they get the answer wrong
  //     if (!(answer == livegame.questions[livegame.currentQuestion].answer)) {
  //       livegame.activeParticipants = livegame.activeParticipants.filter((el) => {
  //         return el !== req.user._id;
  //       });
  //     }
  
  //     await livegame.save();
  //     await user.save();
  
  //     res.status(200).json({
  //       status: 'success',
  //       // result:  : 'Correct' ,
  //       // answer: livegame.questions[livegame.currentQuestion].opt,
  //       message: (answer == livegame.questions[livegame.currentQuestion].answer) ? 'Correct!' : 'Wrong'
  //     });
  //   }
  // } else {
  //   console.log(currentTime);
  //   console.log(twoMinsToGameTime);
  //   console.log(livegame.activeStatus);
  //   console.log(livegame.gameInit);
  //   console.log(livegame.currentQuestion);

  //   return next(new AppError('This game is either not yet active or it is not yet time', 400));
  // }
});

