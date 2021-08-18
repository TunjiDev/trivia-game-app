const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('./../models/superAdminModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.createSendToken = (user, message, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  //Remove passsword from the output of signing up a new user.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user
    }
  });
};

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
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The token for this user does not exist', 401));
  }
  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = freshUser;
  next();
});

// AUTHORIZATION

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the user role is part of the role that hass access to the next middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission for this route', 403)
      );
    }
    next();
  };
};
