const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdminModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../error/appError');
