const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const questionController = require('../controllers/questionController');

//SUPERADMIN AUTHENTICATION
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

//CATEGORIES
router.get('/category/:id', categoryController.getCategory);
router.patch('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

router.get('/category', categoryController.getAllCategories);
router.post('/category', categoryController.createCategory);

//QUESTIONS
router.get('/question/:id', questionController.getQuestion);
router.patch('/question/:id', questionController.updateQuestion);
router.delete('/question/:id', questionController.deleteQuestion);

router.get('/question', questionController.getAllQuestions);
router.post('/question', questionController.createQuestion);

module.exports = router;