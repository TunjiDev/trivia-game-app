const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name!'],
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email!']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['superadmin'],
        default: 'superadmin'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password!'],
        select: false
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//Hashing the password
superAdminSchema.pre('save', async function(next) {
    //Only run this funtion is password was actually modified
    if (!this.isModified('password')) return next();

    //Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

//FOR LOGGING IN: Checking if the inputted password matches that in the database
superAdminSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;