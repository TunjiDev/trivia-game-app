const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//SUPERADMIN AUTHENTICATION
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

router.use(adminController.protected);

//LIVEGAME
router.route('/livegame')
    .get(adminController.getAllLiveGames)
    .post(adminController.createLiveGame);

router.route('/livegame/:id')
    .get(adminController.getLivegame)
    .patch(adminController.updateLivegame)
    .delete(adminController.deleteLiveGame);

//ADMINS
router.route('/lesseradmin')
    .get(adminController.getAllAdmins)
    .post(adminController.restrictTo('superadmin'), adminController.createAdmin);

router.route('/lesseradmin/:id')
    .get(adminController.getAdmin)
    .delete(adminController.restrictTo('superadmin'), adminController.deleteAdmin);

//USERS
router.route('/user')
    .get(adminController.getAllUsers);

router.route('/user/:id')
    .get(adminController.getUser)
    .put(adminController.updateUser);

module.exports = router;