const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const questionRouter = require('./questionRoutes');

//CATEGORIES
router.use(adminController.protected);
router.use('/:categoryName/questions', questionRouter);

router.route('/:id')
    .get(categoryController.getCategory)
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);

router.route('/')
    .get(categoryController.getAllCategories)
    .post(categoryController.createCategory);

module.exports = router;