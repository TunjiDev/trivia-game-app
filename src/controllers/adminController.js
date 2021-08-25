const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const APIFeatures = require('../../utils/apiFeatures');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const authController = require('./authController');

//SUPERADMIN
exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (email != 'winnerakako09@gmail.com') return next(new AppError('You are not authorized to access this route!', 401));

    const newUser = await Admin.create({
        name,
        email,
        password
    });

    authController.createSendToken(newUser, 'token sent successfully!', 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    //1) Check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    //2) Check if user exists && password is correct
    const user = await Admin.findOne({email}).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //3) If everything is ok, send token to client
    authController.createSendToken(user, 'token sent successfully!', 200, req, res);
});

exports.protected = catchAsync(async (req, res, next) => {
    // Get token
    let token;
   
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
  
    if (!token)
      return next(
        new AppError('You are not Logged in, Login to get access', 401)
      );
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const freshAdmin = await Admin.findById(decoded.id);
    if (!freshAdmin) {
      return next(new AppError('The token for this admin does not exist', 401));
    }
    // GRANT ACCESS TO THE PROTECTED ROUTE
    req.admin = freshAdmin;
    next();
});

// AUTHORIZATION
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }
    next();
  };
};

//ADMINS
exports.createAdmin = catchAsync(async (req, res, next) => {
  const newUser = await Admin.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  newUser.role = 'admin';

  await newUser.save();

  res.status(200).json({
      status: 'success',
      data: {
          newUser
      }
  });
});

exports.getAllAdmins = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Admin.find(), req.query)
      .filter()
      .sort()
      .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
        users
    }
  });
});

exports.getAdmin = catchAsync(async (req, res, next) => {
  const user = await Admin.findById(req.params.id);

  if (!user) return next(new AppError('No admin found with that ID', 404));

  res.status(200).json({
      status: 'success',
      data: {
          user
      }
  });
});

exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const user = await Admin.findByIdAndDelete(req.params.id);

  if (!user) return next(new AppError('No admin found with that ID', 404));

  res.status(204).json({
      status: 'success',
      data: null
  });
});

//USERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
        users
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({
      status: 'success',
      data: {
          user
      }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(204).json({
      status: 'success',
      data: null
  });
});