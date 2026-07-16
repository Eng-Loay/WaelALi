const express = require('express');
const pool = require('../../config/db');
const authStudent = require('../../middleware/authStudent');
const { signToken, verifyToken } = require('../../utils/token');
const { buildPlayerHtml } = require('../../utils/lessonPlayer');
const {
  logStudentActivity,
  studentHasCourseAccess,
  getStudentCourseLessonProgress,
} = require('../../utils/studentActivity');

const router = express.Router();

const LESSON_ACTIVITY = {
  video: 'watch_video',
  text: 'read_text',
  pdf: 'open_pdf',
  record: 'open_record',
  assignment: 'open_lesson',
  quiz: 'open_lesson',
};

function sanitizeLessonForStudent(lesson) {
  if (lesson.lesson_type === 'video' || lesson.lesson_type === 'record') {
    const { content_url, ...rest } = lesson;
    return { ...rest, has_media: !!content_url };
  }
  return lesson;
}

async function resolveLessonMedia(lessonId, courseId) {
  const id = String(lessonId);

  if (id.startsWith('legacy-')) {
    // legacy-video-12 / legacy-pdf-12
    const parts = id.split('-');
    const kind = parts[1];
    const sectionId = Number(parts[2]);
    if (!sectionId || !['video', 'pdf', 'link'].includes(kind)) return null;
    const [sections] = await pool.query(
      'SELECT * FROM course_sections WHERE id = ? AND course_id = ?',
      [sectionId, courseId],
    );
    if (!sections.length) return null;
    const s = sections[0];
    if (kind === 'video' && s.video_url) {
      return { course_id: courseId, content_url: s.video_url, lesson_type: 'video' };
    }
    return null;
  }

  const [lessons] = await pool.query(
    `SELECT id, course_id, content_url, lesson_type, is_published
     FROM course_lessons WHERE id = ?`,
    [Number(lessonId)],
  );
  if (!lessons.length || !lessons[0].content_url) return null;
  if (courseId && Number(lessons[0].course_id) !== Number(courseId)) return null;
  return lessons[0];
}

async function loadCourseContent(courseId) {
  const [sections] = await pool.query(
    'SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order, id',
    [courseId],
  );
  const [lessons] = await pool.query(
    `SELECT id, section_id, course_id, title_ar, lesson_type, content_text, content_url, sort_order
     FROM course_lessons
     WHERE course_id = ? AND is_published = 1
     ORDER BY sort_order, id`,
    [courseId],
  );

  const sectionRows = sections.length
    ? sections
    : lessons.length
      ? [{ id: 0, course_id: courseId, title_ar: 'محتوى الكورس', sort_order: 0 }]
      : [];

  const legacyLesson = (section, suffix, lessonType, contentUrl, contentText) => ({
    id: `legacy-${suffix}-${section.id}`,
    section_id: section.id,
    course_id: courseId,
    title_ar: section.title_ar,
    lesson_type: lessonType,
    content_text: contentText || null,
    content_url: contentUrl || null,
    sort_order: suffix,
  });

  return {
    sections: sectionRows
      .map((s) => {
        const sectionLessons = lessons.filter((l) => Number(l.section_id) === Number(s.id));
        if (sectionLessons.length) {
          return {
            ...s,
            title: s.title_ar,
            lessons: sectionLessons.map(sanitizeLessonForStudent),
          };
        }

        const legacy = [];
        if (s.video_url) legacy.push(legacyLesson(s, 'video', 'video', s.video_url, null));
        if (s.pdf_url) legacy.push(legacyLesson(s, 'pdf', 'pdf', s.pdf_url, null));
        if (s.link_url) {
          legacy.push(legacyLesson(s, 'link', 'text', null, `رابط خارجي: ${s.link_url}`));
        }
        if (!legacy.length && s.description_ar) {
          legacy.push(legacyLesson(s, 'text', 'text', null, s.description_ar));
        }

        return {
          ...s,
          title: s.title_ar,
          lessons: legacy.map(sanitizeLessonForStudent),
        };
      })
      .filter((s) => s.lessons.length > 0 || sections.length > 0),
  };
}

// Public player page — auth via signed query token (iframe cannot send Bearer header)
router.get('/lessons/:lessonId/player', async (req, res) => {
  try {
    const token = req.query.t;
    if (!token) return res.status(401).send('unauthorized');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).send('unauthorized');
    }

    if (payload.purpose !== 'lesson_player') {
      return res.status(403).send('forbidden');
    }
    if (String(payload.lessonId) !== String(req.params.lessonId)) {
      return res.status(403).send('forbidden');
    }

    const media = await resolveLessonMedia(req.params.lessonId, payload.courseId);
    if (!media?.content_url) return res.status(404).send('not found');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    res.setHeader('Cache-Control', 'no-store');
    res.send(buildPlayerHtml(media.content_url));
  } catch (error) {
    console.error(error);
    res.status(500).send('error');
  }
});

router.use(authStudent);

router.get('/:courseId/content', async (req, res) => {
  const courseId = Number(req.params.courseId);
  try {
    const allowed = await studentHasCourseAccess(req.student.id, courseId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'غير مسجل في هذا الكورس' });
    }

    const [courses] = await pool.query(
      `SELECT c.*, g.name_ar AS grade_name
       FROM courses c
       LEFT JOIN grades g ON g.id = c.grade_id
       WHERE c.id = ?`,
      [courseId],
    );
    if (!courses.length) {
      return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
    }

    const tree = await loadCourseContent(courseId);
    const progress = await getStudentCourseLessonProgress(req.student.id, courseId);

    await logStudentActivity({
      studentId: req.student.id,
      courseId,
      activityType: 'open_course',
      titleAr: courses[0].title_ar,
    });

    res.json({
      success: true,
      data: {
        course: courses[0],
        ...tree,
        completedLessonIds: progress.completedLessonIds,
        lastLessonId: progress.lastLessonId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل محتوى الكورس' });
  }
});

// Temporary play URL — never returns the raw YouTube/media link
router.get('/:courseId/lessons/:lessonId/player-token', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const lessonId = req.params.lessonId;
  try {
    const allowed = await studentHasCourseAccess(req.student.id, courseId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'غير مسجل في هذا الكورس' });
    }

    const media = await resolveLessonMedia(lessonId, courseId);
    if (!media?.content_url) {
      return res.status(404).json({ success: false, message: 'لا يوجد وسائط لهذا الدرس' });
    }

    const token = signToken(
      {
        lessonId: String(lessonId),
        courseId,
        studentId: req.student.id,
        purpose: 'lesson_player',
        role: 'student',
      },
      6,
    );

    res.json({
      success: true,
      data: {
        url: `/api/student/courses/lessons/${encodeURIComponent(lessonId)}/player?t=${token}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'تعذّر تشغيل هذا الدرس' });
  }
});

router.post('/:courseId/lessons/:lessonId/activity', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const lessonId = Number(req.params.lessonId);
  try {
    const allowed = await studentHasCourseAccess(req.student.id, courseId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'غير مسجل في هذا الكورس' });
    }

    if (!Number.isFinite(lessonId)) {
      return res.json({ success: true });
    }

    const [lessons] = await pool.query(
      `SELECT id, title_ar, lesson_type, course_id
       FROM course_lessons
       WHERE id = ? AND course_id = ? AND is_published = 1`,
      [lessonId, courseId],
    );
    if (!lessons.length) {
      return res.status(404).json({ success: false, message: 'الدرس غير موجود' });
    }

    const lesson = lessons[0];
    const activityType = LESSON_ACTIVITY[lesson.lesson_type] || 'open_lesson';

    await logStudentActivity({
      studentId: req.student.id,
      courseId,
      lessonId,
      activityType,
      titleAr: lesson.title_ar,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تسجيل النشاط' });
  }
});

module.exports = router;
