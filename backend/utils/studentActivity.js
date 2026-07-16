const pool = require('../config/db');

const ACTIVITY_TYPES = new Set([
  'open_course',
  'open_lesson',
  'watch_video',
  'read_text',
  'open_pdf',
  'open_record',
  'submit_assignment',
  'open_exam',
  'course_progress',
]);

const ACTIVITY_LABELS = {
  open_course: 'فتح الكورس',
  open_lesson: 'فتح درس',
  watch_video: 'مشاهدة فيديو',
  read_text: 'قراءة درس نصي',
  open_pdf: 'فتح ملف PDF',
  open_record: 'تشغيل تسجيل',
  submit_assignment: 'تسليم واجب',
  open_exam: 'فتح اختبار',
  course_progress: 'تقدم في الكورس',
};

/** YYYY-MM-DD in Africa/Cairo — matches Egypt school day */
function cairoTodayDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function markCoursePresentToday(studentId, courseId) {
  if (!studentId || !courseId) return;
  const attendanceDate = cairoTodayDate();
  try {
    await pool.query(
      `INSERT INTO course_attendance (course_id, student_id, attendance_date, status)
       VALUES (?, ?, ?, 'present')
       ON DUPLICATE KEY UPDATE status = 'present', updated_at = CURRENT_TIMESTAMP`,
      [courseId, studentId, attendanceDate],
    );
  } catch (error) {
    // Table may be missing on older DBs — attendance page still falls back to activity.
    console.warn('markCoursePresentToday:', error.message);
  }
}

async function logStudentActivity({
  studentId,
  courseId,
  lessonId = null,
  activityType,
  titleAr = null,
}) {
  if (!studentId || !courseId || !ACTIVITY_TYPES.has(activityType)) return null;

  let insertId = null;
  try {
    const [result] = await pool.query(
      `INSERT INTO student_activity (student_id, course_id, lesson_id, activity_type, title_ar)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, courseId, lessonId, activityType, titleAr],
    );
    insertId = result.insertId;
  } catch (error) {
    console.warn('logStudentActivity:', error.message);
  }

  // Any course engagement = present for today (video, text, open course, …)
  await markCoursePresentToday(studentId, courseId);

  return insertId;
}

async function studentHasCourseAccess(studentId, courseId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1`,
    [studentId, courseId],
  );
  return rows.length > 0;
}

const LESSON_ACTIVITY_TYPES = [
  'open_lesson',
  'watch_video',
  'read_text',
  'open_pdf',
  'open_record',
];

async function getStudentCourseLessonProgress(studentId, courseId) {
  const placeholders = LESSON_ACTIVITY_TYPES.map(() => '?').join(', ');
  const [completedRows] = await pool.query(
    `SELECT DISTINCT lesson_id
     FROM student_activity
     WHERE student_id = ? AND course_id = ? AND lesson_id IS NOT NULL
       AND activity_type IN (${placeholders})`,
    [studentId, courseId, ...LESSON_ACTIVITY_TYPES],
  );

  const [[lastRow]] = await pool.query(
    `SELECT lesson_id
     FROM student_activity
     WHERE student_id = ? AND course_id = ? AND lesson_id IS NOT NULL
       AND activity_type IN (${placeholders})
     ORDER BY created_at DESC
     LIMIT 1`,
    [studentId, courseId, ...LESSON_ACTIVITY_TYPES],
  );

  return {
    completedLessonIds: completedRows.map((row) => row.lesson_id),
    lastLessonId: lastRow?.lesson_id ?? null,
  };
}

module.exports = {
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  cairoTodayDate,
  markCoursePresentToday,
  logStudentActivity,
  studentHasCourseAccess,
  getStudentCourseLessonProgress,
};
