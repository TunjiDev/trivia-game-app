const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const Admin = require('../models/adminModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const authController = require('./authController');

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