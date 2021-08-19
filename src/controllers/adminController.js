const SuperAdmin = require('../models/superAdminModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../error/appError');
const authController = require('./authController');

exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (email != 'winnerakako09@gmail.com') return next(new AppError('You are not authorized to access this route!', 401));

    const newUser = await SuperAdmin.create({
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
    const user = await SuperAdmin.findOne({email}).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //3) If everything is ok, send token to client
    authController.createSendToken(user, 'token sent successfully!', 200, req, res);
});