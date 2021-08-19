const express = require('express');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.all(
  '/',
  catchAsync(async (req, res, next) => {
    res.redirect(
      'https://documenter.getpostman.com/view/15594941/TzzAMcSF#434e804b-831b-41e5-b48e-74ca6109b04b'
    );
  })
);

module.exports = router;
