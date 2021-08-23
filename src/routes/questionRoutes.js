const express = require('express');
const router = express.Router({mergeParams: true});
const adminController = require('../controllers/adminController');
const questionController = require('../controllers/questionController');

router.use(adminController.protected);

//QUESTIONS
router.route('/:id')
    .get(questionController.getQuestion)
    .patch(questionController.updateQuestion)
    .delete(questionController.deleteQuestion);

router.route('/')
    .get(questionController.getAllQuestions)
    .post(questionController.createQuestion);

module.exports = router;