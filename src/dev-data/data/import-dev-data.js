const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../../models/userModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
// const DB = 'mongodb://localhost:27017/tours';

const connectToDb = async function() {
    try {
        await mongoose.connect(DB, {
            useCreateIndex: true,
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useFindAndModify: false
        });
        console.log('Database is connected!');

    } catch (error) {
        console.log(error);
    }
};
connectToDb();

//READ JSON FILE
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));

//IMPORT DATA INTO DATABASE
const importData = async () => {
    try {
        await User.create(users, {validateBeforeSave: false});
        console.log('Data successfully loaded!');
    } catch (error) {
        console.log(error);
    }
    process.exit(); //Stopping the application from running
};

//DELETE ALL DATA FROM THE COLLECTION
const deleteData = async () => {
    try {
        await User.deleteMany();
        console.log('Data successfully deleted!');
    } catch (error) {
        console.log(error);
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
}
if (process.argv[2] === '--delete') {
    deleteData();
}