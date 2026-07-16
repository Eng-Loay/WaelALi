const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const uploadRouter = require('./upload');
const courseContentRouter = require('./courseContent');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/courses', courseContentRouter);
router.use('/', dashboardRouter);

module.exports = router;
