const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const User = require('../models/userModel');
const sendSms = require('../../utils/sendSms');
const crypto = require('crypto');
const authController = require('../controllers/authController');
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

//USER

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

//LIVE GAME

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

  // 2) Check if they have already joined the game
  let participantsNamesArr = [];
  
  livegame.participants.forEach((el) => {
    participantsNamesArr.push(el.username);
  });

  if (participantsNamesArr.includes(req.user.username)) {
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
  let objectForParticipants = {
    username: user.username,
    photo: user.profilePicture
  };

  livegame.participants.push(objectForParticipants);
  
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
  console.log(user.activeGames);
  console.log(willStartInTwentyMinsOrLess);
  console.log(activeGametimeArr);
  console.log(twentyMinsAfterCurrentTime);

  res.status(200).json({
    status: 'success',
    message: 'You have successfully joined this live game!'
  });
});