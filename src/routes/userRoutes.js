const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');

router.route('/signup').post(userController.createUser);
router.route('/verify').post(userController.verifyUser);

module.exports = router;
