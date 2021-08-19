const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router.route('/signup').post(userController.createUser);
router.route('/verify').post(userController.verifyUser);

router.use(authController.protected);
// Protect update
router.route('/update').post(userController.setProfilePic);

module.exports = router;
