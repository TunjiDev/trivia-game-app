const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const livegameController = require('../controllers/livegameController');
const instantgameController = require('./../controllers/instantgameController');
const authController = require('./../controllers/authController');
const questionController = require('./../controllers/questionController');
const categoryController = require('./../controllers/categoryController');

router.route('/signup').post(userController.createUser);
router.route('/verify').post(userController.verifyUser);

router.use(authController.protected);

router
  .route('/')
  .get(userController.getUser)
  .get(userController.getAllUsers)
  .delete(userController.deleteUser);
router.route('/update').put(userController.updateUser);

router.route('/questions').get(questionController.getAllQuestions);
router.route('/questions/categories').get(categoryController.getAllCategories);
router.route('/questions/categories/:id').get(categoryController.getCategory);

//LIVE GAME
router.route('/livegame')
  .get(livegameController.getAllLiveGames)
  .post(livegameController.joinLiveGame);

router.route('/gamezone')
  .post(livegameController.gameZone);

//INSTANT GAME
router.route('/instantgame')
  .get(instantgameController.getAllInstantGames)
  .post(instantgameController.playInstantGame);

router.route('/instantgame-zone')
  .post(instantgameController.gameZone);

router.route('/logout').get(authController.logout);

module.exports = router;