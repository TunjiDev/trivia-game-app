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

  User.findOne({ verificationCode }, async (err, user) => {
    if (err) {
      return next(new AppError('Unable to verify user request new code', 500));
    }

    user.isVerified = true;
    await user.save();

    authController.createSendToken(
      user,
      'Successfully verified',
      200,
      req,
      res
    );
  }).select('+verificationCode');
});

exports.updateUser = catchAsync(async (req, res, next) => {
  req.user.username = req.body.username;
  if (req.body.username)
    return next( new AppError('Please input username',400))
  await req.user.save();
  res.status(200).json({
    status: 'success',
    username
  });
});

// AWS update
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION
});

const upload = bucketName =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function(req, file, cb) {
        cb(null, `image-${Date.now()}.jpeg`);
      }
    })
  });

exports.setProfilePic = (req, res, next) => {
  console.log(req.file)
  const uploadSingle = upload(process.env.BUCKET_NAME).single('profilePicture');

  uploadSingle(req, res, async err => {
    if (err)
      return next(new AppError('Couldnt not upload image try again', 500));

    req.user.photoProfile = req.file.location;
    await req.user.save();

    next();
  });
};
