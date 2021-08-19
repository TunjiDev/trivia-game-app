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

// AWS update
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = bucketName =>
  multer({
    fileFilter: multerFilter,
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function(req, file, cb) {
        cb(
          null,
          `${process.env.NODE_ENV}/image-${req.user.id}-${Date.now()}.jpeg`
        );
      }
    })
  });

exports.setProfilePic = (req, res, next) => {
  const uploadSingle = upload(process.env.BUCKET_NAME).single('profilePicture');

  uploadSingle(req, res, async err => {
    if (err)
      return next(new AppError('Couldnt not upload image try again', 500));

    if (!req.body.username)
      return next(new AppError('Please input username', 400));

    const user = await User.findById(req.user.id);

    user.profilePicture = req.file.location;
    user.username = req.body.username;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Username and photo has been updated',
      user
    });
  });
};
