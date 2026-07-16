const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const subscribersRouter = require('./subscribers');
const studentsRouter = require('./students');
const coursesRouter = require('./courses');
const gradesRouter = require('./grades');
const couponsRouter = require('./coupons');
const assignmentsRouter = require('./assignments');
const examsRouter = require('./exams');
const paymentsRouter = require('./payments');
const bannersRouter = require('./banners');
const notificationsRouter = require('./notifications');
const uploadRouter = require('./upload');
const courseContentRouter = require('./courseContent');
const attendanceRouter = require('./attendance');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/subscribers', subscribersRouter);
router.use('/students', studentsRouter);
router.use('/courses', coursesRouter);
router.use('/grades', gradesRouter);
router.use('/coupons', couponsRouter);
router.use('/assignments', assignmentsRouter);
router.use('/exams', examsRouter);
router.use('/payments', paymentsRouter);
router.use('/banners', bannersRouter);
router.use('/notifications', notificationsRouter);
router.use('/upload', uploadRouter);
router.use('/course-content', courseContentRouter);
router.use('/attendance', attendanceRouter);

module.exports = router;
