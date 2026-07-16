require('dotenv').config();
const pool = require('../config/db');

const DEMO_LESSONS = [
  {
    title_ar: 'مقدمة في الدرس',
    lesson_type: 'text',
    content_text: 'مرحباً بك في هذا الكورس.\n\nهذا درس تجريبي لعرض محتوى الكورس عند الطالب. يمكن للأدمن إضافة دروس فيديو وPDF وواجبات من لوحة التحكم → الكورسات → محتوى الكورس.',
  },
  {
    title_ar: 'ملخص الدرس الأول',
    lesson_type: 'text',
    content_text: 'في هذا الدرس راجعنا أهم المفاهيم الأساسية.\n\nافتح باقي الدروس من القائمة على اليمين — حضورك بيتسجّل تلقائياً عند فتح كل درس.',
  },
];

async function ensureSection(courseId) {
  const [existing] = await pool.query(
    'SELECT id FROM course_sections WHERE course_id = ? ORDER BY sort_order, id LIMIT 1',
    [courseId],
  );
  if (existing.length) return existing[0].id;

  const [result] = await pool.query(
    'INSERT INTO course_sections (course_id, title_ar, sort_order) VALUES (?, ?, 0)',
    [courseId, 'القسم الأول'],
  );
  return result.insertId;
}

async function seedCourse(courseId, courseTitle) {
  const [[{ lessonCount }]] = await pool.query(
    'SELECT COUNT(*) AS lessonCount FROM course_lessons WHERE course_id = ?',
    [courseId],
  );
  if (Number(lessonCount) > 0) {
    console.log(`Skip course ${courseId} (${courseTitle}) — already has ${lessonCount} lesson(s)`);
    return;
  }

  const sectionId = await ensureSection(courseId);
  let order = 0;
  for (const lesson of DEMO_LESSONS) {
    await pool.query(
      `INSERT INTO course_lessons
        (section_id, course_id, title_ar, lesson_type, content_text, content_url, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, NULL, ?, 1)`,
      [sectionId, courseId, lesson.title_ar, lesson.lesson_type, lesson.content_text, order],
    );
    order += 1;
  }
  console.log(`Seeded ${DEMO_LESSONS.length} demo lesson(s) for course ${courseId} (${courseTitle})`);
}

async function main() {
  const [courses] = await pool.query(`
    SELECT DISTINCT c.id, c.title_ar
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    ORDER BY c.id
  `);

  for (const course of courses) {
    await seedCourse(course.id, course.title_ar);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
