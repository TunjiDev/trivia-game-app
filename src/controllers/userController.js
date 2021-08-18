const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const User = require('../models/userModel');
const sendSms = require('../../utils/sendSms');
const crypto = require('crypto');
const authController = require('../controllers/authController');

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

  // 4. send OTP
  await sendSms(user.phone, `Your OTP is ${otp.code}`);
  //   5.) After Otp then save to DB
  await user.save();

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

  const user = await User.findOne({ verificationCode });

  if (!user)
    return next(new AppError('Unable to verify user request new code', 400));

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  authController.createSendToken(user, 'Successfully verified', 200, req, res);
});
