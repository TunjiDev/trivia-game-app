const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdminModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');

const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    //Remove passsword from the output of signing up a new user.
    user.password = undefined; 

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (email != 'winnerakako09@gmail.com') return next(new AppError('You are not authorized to access this route!', 401));

    const newUser = await SuperAdmin.create({
        name,
        email,
        password
    });

    createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    //1) Check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    //2) Check if user exists && password is correct
    const user = await SuperAdmin.findOne({email}).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //3) If everything is ok, send token to client
    createSendToken(user, 200, req, res);
});