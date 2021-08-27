const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const questionController = require('./../controllers/questionController');
const categoryController = require('./../controllers/categoryController');

router.route('/signup').post(userController.createUser);
router.route('/verify').post(userController.verifyUser);

router.use(authController.protected);
// Protect update
router
  .route('/')
  .get(userController.getUser)
  .delete(userController.deleteUser);
router.route('/update').put(userController.updateUser);

router.route('/questions').get(questionController.getAllQuestions)
router.route('/questions/categories').get(categoryController.getAllCategories)
router.route('/questions/categories/:id').get(categoryController.getCategory)

router.route('/logout').get(authController.logout);

module.exports = router;
