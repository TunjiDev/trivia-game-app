const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/appError");
const User = require("../models/userModel");
const sendSms = require("../../utils/sendSms");
const crypto = require("crypto");
const authController = require("../controllers/authController");
const Livegame = require("../models/livegameModel");
const APIFeatures = require("../../utils/apiFeatures");

const generateOTP = function () {
  // 1.) generate random 4 digit statusCode
  const code = Math.floor(Math.random() * 8999 + 1000);
  // 2.)hash it

  const hash = crypto.createHash("md5").update(`${code}`).digest("hex");

  return { hash, code };
};

//========================== USER =============================
exports.getUser = catchAsync(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({ user });
});

exports.createUser = catchAsync(async (req, res, next) => {
  // 1. Get Phone number
  const rawPhone = req.body.phoneNumber.startsWith("+234");
  // 2. Validate number
  if (!rawPhone)
    return next(new AppError("Only +234 code for Nigeria is acceptable", 400));

  const userExist = await User.findOne({ phone: req.body.phoneNumber });

  const otp = generateOTP();

  // If user already exists send OTP to login
  if (userExist) {
    userExist.isVerified = false;
    userExist.verificationCode = otp.hash;
    await userExist.save();
    await sendSms(req.body.phoneNumber, `Your OTP is ${otp.code}`);

    res.status(200).json({
      status: "success",
      message: "OTP has been sent, Verify to proceed",
    });
  } else {
    // 3. create user with number
    const user = new User();
    user.phone = req.body.phoneNumber;
    user.verificationCode = otp.hash;
    await user.save();
    await sendSms(user.phone, `Your OTP is ${otp.code}`);

    res.status(201).json({
      status: "success",
      message: "OTP has been sent, Verify to proceed",
    });
  }
});

exports.verifyUser = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  // hashing
  const verificationCode = crypto
    .createHash("md5")
    .update(`${code}`)
    .digest("hex");

  const user = await User.findOneAndUpdate(
    { verificationCode },
    { isVerified: true, verificationCode: undefined, verfiedAt: Date.now() },
    { new: true }
  ).select("+verificationCode");

  if (!user) return next(new AppError("Could not verify user, Try Again", 400));

  authController.createLoginCookie(
    user,
    "Successfully verified",
    200,
    req,
    res
  );
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (!req.body.username)
    return next(new AppError("Please input username", 400));

  const user = await User.findById(req.user.id);

  user.username = req.body.username;
  user.profilePicture = req.body.profilePicture;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Username and photo has been updated",
    user,
  });
});

exports.deleteUser = catchAsync(async (req, res, _next) => {
  const _user = await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: "success",
    message: "Successful Deleted Record",
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
    status: "success",
    results: livegames.length,
    data: {
      livegames,
    },
  });
});

exports.joinLiveGame = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const livegame = await Livegame.findOne({
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

//========================== GAME ZONE =============================
exports.gameZone = catchAsync(async (req, res, next) => {
  const livegame = await Livegame.findById(req.body.gameId);
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
    if (currentTime < livegame.gameTime) {
      console.log("1");
      console.log(livegame);
      res.status(200).json({
        status: "success",
        message: "You have been taken to the game zone.",
      });
    }
    //INITIALIZING GAME
    if (currentTime >= livegame.gameTime && !livegame.gameInit) {
      // 4) Set current question to 0
      livegame.currentQuestion = 0;

      // 5) Set questions timer to 30 seconds.
      livegame.questionsTimer = timer;

      livegame.gameInit = true;

      await livegame.save();
      await user.save();

      console.log("2");
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
  // GAME ZONE: STEP 2
  //GET THE QUESTIONS
  if (livegame.gameInit && currentTime >= livegame.gameTime && currentTime < livegame.questionsTimer && livegame.activeStatus && !answer) {
    // Check if user is a participant in the game
    if (!livegame.participants.includes(req.user._id)) {
      return next(new AppError("You are not a participant in this game!", 400));
    }

    console.log("3");
    res.status(200).json({
      status: "success",
      question: livegame.questions[livegame.currentQuestion].question,
      options: livegame.questions[livegame.currentQuestion].options,
      message: "Question has been returned"
    });
  }

  //******************************************* */
  // GAME ZONE: STEP 3
  //MOVING TO THE NEXT QUESTION
  if (livegame.gameInit && currentTime >= livegame.gameTime && livegame.activeStatus && currentTime > livegame.questionsTimer && !answer && !livegame.gameEnded) {
    // Increment question state by 1
    livegame.currentQuestion = livegame.currentQuestion + 1;
    // Set questions timer to 30 seconds.
    livegame.questionsTimer = +livegame.gameTime + 30000;

    await livegame.save();
    
    if (livegame.currentQuestion > 8) {
      livegame.gameEnded = true;

      await livegame.save();
    }

    res.status(200).json({
      status: "success",
      question: livegame.questions[livegame.currentQuestion].question,
      options: livegame.questions[livegame.currentQuestion].options,
      message: "Next Question."
    });
    console.log("4");
  }

  //******************************************* */
  // GAME ZONE: STEP 4
  //SUBMITTING ANSWERS
  if (livegame.gameInit && currentTime >= livegame.gameTime /*&& currentTime < livegame.questionsTimer*/ && livegame.activeStatus && answer) {
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

    await livegame.save();
    await user.save();

    console.log("5");

    res.status(200).json({
      status: "success",
      timer: livegame.questionsTimer,
      message:
        answer == livegame.questions[livegame.currentQuestion].answer
          ? "Correct!"
          : "Wrong!",
    });
  } else if (livegame.gameInit && currentTime >= livegame.gameTime && currentTime > livegame.questionsTimer && livegame.activeStatus && answer) {
      return next(new AppError("You have failed a question and no longer a participant in this game!", 400));
    }

  // GAME ZONE: STEP 5
  //IF EXTRALIFE OR ERASER IS BEING USED
  if (livegame.gameInit && currentTime >= livegame.gameTime && currentTime < livegame.questionsTimer && livegame.activeStatus && !answer && action) {
    // Check if user is a participant in the game
    if (!livegame.participants.includes(req.user._id)) {
      return next(new AppError("You are not a participant in this game!", 400));
    }

    ///// INSTANCE 3: ERASER does not put the user back into the game. It only removes one wrong answer. But this one can be fixed later.
    ///// INSTANCE 4: I changed it from checking if the eraser and extralives != 0 to > 0. They can only use erasers if they have at least one.
    /// Check if it's eraser that's being used
    if (req.user.erasers > 0 && action == "eraser") {
      req.user.eraser = req.user.eraser - 1;
      await user.save();

    console.log("6");
      res.status(200).json({
        status: "success",
        question: livegame.questions[livegame.currentQuestion].question,
        options: livegame.questions[livegame.currentQuestion].options,
        message: "Question has been returned"
      });
    }
    /// Check if the user is using extra life
    else if (req.user.extraLives > 0 && action == "extralife") {
      if (!livegame.activeParticipants.includes(req.user._id)) {
        livegame.activeParticipants.push(req.user._id);
        await livegame.save();
      }
      req.user.extraLives = req.user.extraLives - 1;
      await user.save();
    } else {
    console.log("7");
      res.status(200).json({
        status: "success",
        message: "Sorry, you do not have enough erasers or extralives.",
      });
    }

    await livegame.save();
    await user.save();

    console.log("8");
  }

    // GAME ZONE: STEP 6
    //SPLIT THE MONEY(REWARD IN THE LIVEGAME MODEL) AMONGST THE REMAINING ACTIVE PARTICIPANTS
  if (livegame.gameEnded && currentTime >= livegame.gameTime && livegame.gameInit && livegame.activeStatus && currentTime > livegame.questionsTimer && !answer && !livegame.userHasEarned) {
    // Check if user is a participant in the game
    if (!livegame.participants.includes(req.user._id)) {
      return next(new AppError("You are not a participant in this game!", 400));
    }
    // Check if user is still an active participant
    if (!livegame.activeParticipants.includes(req.user._id)) {
      return next(new AppError("You have failed a question and no longer a participant in this game!", 400));
    }
    const moneyWon = livegame.reward / livegame.activeParticipants.length;

    user.earnings = moneyWon;
    livegame.userHasEarned = true;

    await livegame.save();
    await user.save();

    console.log("9");
    res.status(200).json({
      status: "success",
      message: `Congrats! You have won ₦${moneyWon} naira!`
    });
  }

  // GAME ZONE: STEP 7
  // After game has ended and users have won their money, set active status back to false
  // if (livegame.gameEnded && livegame.userHasEarned) {
  //   livegame.activeStatus = false;

  //   await livegame.save();
  // }
});