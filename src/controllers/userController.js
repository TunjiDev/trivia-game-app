const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const User = require('../models/userModel');
const sendSms = require('../../utils/sendSms');
const crypto = require('crypto');
const authController = require('../controllers/authController');
const { promisify } = require('util');
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');

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

  // 3. create user with number
  const otp = generateOTP();
  const user = new User();
  user.phone = req.body.phoneNumber;
  user.verificationCode = otp.hash;

  await user.save();
  // 4. send OTP
  await sendSms(user.phone, `Your OTP is ${otp.code}`);
  //   5.) After Otp then save to DB

  res.status(201).json({
    status: 'success',
    message: 'OTP has been sent, Verify to proceed'
  });
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
    { isVerified: true, verificationCode: undefined },
    { new: true }
  ).select('+verificationCode');

  if (!user) return next(new AppError('Could not verify user, Try Again', 400));

  authController.createSendToken(user, 'Successfully verified', 200, req, res);
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
