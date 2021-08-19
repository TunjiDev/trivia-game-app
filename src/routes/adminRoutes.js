const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');

router.post('/signup', adminController.signup);
router.post('/login', adminController.login);

router.get('/category/:id', categoryController.getCategory);
router.patch('/category/:id', categoryController.updateCategory);

router.get('/category', categoryController.getAllCategories);
router.post('/category', categoryController.createCategory);

module.exports = router;