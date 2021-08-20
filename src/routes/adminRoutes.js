const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const questionController = require('../controllers/questionController');

//SUPERADMIN AUTHENTICATION
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

//CATEGORIES
router.use(adminController.protected);

router.route('/category/:id')
    .get(categoryController.getCategory)
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);

router.route('/category')
    .get(categoryController.getAllCategories)
    .post(categoryController.createCategory);

//QUESTIONS

router.route('/question/:id')
    .get(questionController.getQuestion)
    .patch(questionController.updateQuestion)
    .delete(questionController.deleteQuestion);

router.route('/question')
    .get(questionController.getAllQuestions)
    .post(questionController.createQuestion);

module.exports = router;