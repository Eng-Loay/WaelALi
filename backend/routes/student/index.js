const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const uploadRouter = require('./upload');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/', dashboardRouter);

module.exports = router;
