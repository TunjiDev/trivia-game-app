const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const livegameController = require('../controllers/livegameController');
const livegamedemoController = require('../controllers/livegameDEMOController');

//SUPERADMIN AUTHENTICATION
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

router.use(adminController.protected);

//LIVEGAME
router.route('/livegame')
    .get(livegameController.getAllLiveGames)
    .post(livegameController.createLiveGame);

router.route('/livegame/:id')
    .get(livegameController.getLivegame)
    .patch(livegameController.updateLivegame)
    .delete(livegameController.deleteLiveGame);

//LIVEGAME DEMO
// router.route('/livegame')
//     .get(livegamedemoController.getAllLiveGames)
//     .post(livegamedemoController.createLiveGame);

// router.route('/livegame/:id')
//     .get(livegamedemoController.getLivegame)
//     .patch(livegamedemoController.updateLivegame)
//     .delete(livegamedemoController.deleteLiveGame);

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