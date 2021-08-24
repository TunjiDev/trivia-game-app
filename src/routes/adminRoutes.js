const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//SUPERADMIN AUTHENTICATION
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

router.use(adminController.protected);

//USERS
router.route('/user')
    .get(adminController.getAllUsers);

router.route('/user/:id')
    .get(adminController.getUser)
    .delete(adminController.deleteUser);

module.exports = router;