const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');
const { normalizeQuestionInput } = require('../../utils/questionHelpers');

const router = express.Router();
router.use(authAdmin);

const LESSON_TYPES = new Set(['video', 'text', 'record', 'pdf', 'assignment', 'quiz']);

async function getCourse(courseId) {
  const [rows] = await pool.query(
    `SELECT c.*, g.name_ar AS grade_name
     FROM courses c
     LEFT JOIN grades g ON g.id = c.grade_id
     WHERE c.id = ?`,
    [courseId],
  );
  return rows[0] || null;
}

async function loadContentTree(courseId) {
  let [sections] = await pool.query(
    'SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order, id',
    [courseId],
  );

  if (!sections.length) {
    const [ins] = await pool.query(
      'INSERT INTO course_sections (course_id, title_ar, sort_order) VALUES (?, ?, 0)',
      [courseId, 'القسم 1'],
    );
    sections = [{
      id: ins.insertId,
      course_id: Number(courseId),
      title_ar: 'القسم 1',
      description_ar: null,
      sort_order: 0,
    }];
  }

  const [lessons] = await pool.query(
    'SELECT * FROM course_lessons WHERE course_id = ? ORDER BY sort_order, id',
    [courseId],
  );

  return {
    sections: sections.map((s) => ({
      ...s,
      title: s.title_ar,
      lessons: lessons.filter((l) => Number(l.section_id) === Number(s.id)),
    })),
    stats: {
      sections: sections.length,
      lessons: lessons.length,
    },
  };
}

async function nextSortOrder(table, whereSql, params) {
  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM ${table} WHERE ${whereSql}`,
    params,
  );
  return rows[0].next_order;
}

router.get('/:courseId/content', async (req, res) => {
  try {
    const course = await getCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
    }
    const tree = await loadContentTree(req.params.courseId);
    res.json({ success: true, data: { course, ...tree } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل محتوى الكورس' });
  }
});

router.post('/:courseId/sections', async (req, res) => {
  try {
    const course = await getCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
    }

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS c FROM course_sections WHERE course_id = ?',
      [req.params.courseId],
    );
    const n = Number(countRows[0].c) + 1;
    const title = (req.body.title_ar || req.body.title || '').trim() || `القسم ${n}`;
    const sortOrder = await nextSortOrder('course_sections', 'course_id = ?', [req.params.courseId]);

    const [result] = await pool.query(
      'INSERT INTO course_sections (course_id, title_ar, sort_order) VALUES (?, ?, ?)',
      [req.params.courseId, title, sortOrder],
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, title_ar: title, sort_order: sortOrder },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إنشاء القسم' });
  }
});

router.put('/sections/:id', async (req, res) => {
  const title = (req.body.title_ar || req.body.title || '').trim();
  if (!title) {
    return res.status(400).json({ success: false, message: 'عنوان القسم مطلوب' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE course_sections SET title_ar = ? WHERE id = ?',
      [title, req.params.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث القسم' });
  }
});

router.delete('/sections/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM course_sections WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف القسم' });
  }
});

router.post('/:courseId/lessons', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const {
    section_id,
    title,
    title_ar,
    lesson_type,
    content_text,
    content_url,
    due_date,
    duration_minutes,
    questions,
    existing_exam_id,
    quizSource,
  } = req.body;

  const lessonTitle = String(title_ar || title || '').trim();
  const type = String(lesson_type || '').trim();

  if (!section_id || !lessonTitle || !LESSON_TYPES.has(type)) {
    return res.status(400).json({ success: false, message: 'بيانات الدرس غير مكتملة' });
  }

  if (['video', 'record', 'pdf'].includes(type) && !String(content_url || '').trim()) {
    return res.status(400).json({ success: false, message: 'رابط أو ملف المحتوى مطلوب' });
  }
  if (type === 'text' && !String(content_text || '').trim()) {
    return res.status(400).json({ success: false, message: 'نص الدرس مطلوب' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [sectionRows] = await connection.query(
      'SELECT id FROM course_sections WHERE id = ? AND course_id = ?',
      [section_id, courseId],
    );
    if (!sectionRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'القسم غير موجود في هذا الكورس' });
    }

    const course = await getCourse(courseId);
    let assignmentId = null;
    let examId = null;
    let storedText = content_text || null;
    let storedUrl = content_url || null;

    if (type === 'assignment') {
      const [asg] = await connection.query(
        `INSERT INTO assignments (course_id, grade_id, title_ar, description_ar, image_url, file_url, due_date, status, delivery_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
        [
          courseId,
          course?.grade_id || null,
          lessonTitle,
          content_text || null,
          null,
          content_url || null,
          due_date || null,
          content_url ? 'pdf' : 'manual',
        ],
      );
      assignmentId = asg.insertId;
      storedText = content_text || null;
      storedUrl = content_url || null;
    }

    if (type === 'quiz') {
      if (quizSource === 'existing' && existing_exam_id) {
        const [exams] = await connection.query('SELECT id, title_ar FROM exams WHERE id = ?', [existing_exam_id]);
        if (!exams.length) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: 'الاختبار المحدد غير موجود' });
        }
        examId = exams[0].id;
      } else {
        const qs = Array.isArray(questions) ? questions : [];
        const [ex] = await connection.query(
          `INSERT INTO exams (course_id, grade_id, title_ar, description_ar, questions_count, duration_minutes, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            courseId,
            course?.grade_id || null,
            lessonTitle,
            content_text || null,
            qs.length || 0,
            duration_minutes || 30,
          ],
        );
        examId = ex.insertId;
        let order = 1;
        for (const raw of qs) {
          const q = normalizeQuestionInput({
            ...raw,
            question_type: raw.question_type || 'multiple_choice',
          });
          if (!q.question_text) continue;
          await connection.query(
            `INSERT INTO exam_questions
              (exam_id, question_text, question_type, image_url, pdf_url, options, correct_answer, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              examId,
              q.question_text,
              q.question_type,
              q.image_url,
              q.pdf_url,
              q.options,
              q.correct_answer,
              order,
            ],
          );
          order += 1;
        }
        if (order > 1) {
          await connection.query('UPDATE exams SET questions_count = ? WHERE id = ?', [order - 1, examId]);
        }
      }
    }

    const [sortRows] = await connection.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM course_lessons WHERE section_id = ?',
      [section_id],
    );

    const [result] = await connection.query(
      `INSERT INTO course_lessons
        (section_id, course_id, title_ar, lesson_type, content_text, content_url, assignment_id, exam_id, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        section_id,
        courseId,
        lessonTitle,
        type,
        storedText,
        storedUrl,
        assignmentId,
        examId,
        sortRows[0].next_order,
      ],
    );

    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إنشاء الدرس' });
  } finally {
    connection.release();
  }
});

router.put('/lessons/:id', async (req, res) => {
  const {
    title,
    title_ar,
    content_text,
    content_url,
    is_published,
  } = req.body;
  const lessonTitle = String(title_ar || title || '').trim();
  if (!lessonTitle) {
    return res.status(400).json({ success: false, message: 'عنوان الدرس مطلوب' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM course_lessons WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'الدرس غير موجود' });
    }
    const lesson = rows[0];

    await pool.query(
      `UPDATE course_lessons
       SET title_ar = ?, content_text = ?, content_url = ?, is_published = ?
       WHERE id = ?`,
      [
        lessonTitle,
        content_text !== undefined ? content_text : lesson.content_text,
        content_url !== undefined ? content_url : lesson.content_url,
        is_published === undefined ? lesson.is_published : Boolean(is_published),
        req.params.id,
      ],
    );

    if (lesson.assignment_id) {
      await pool.query(
        'UPDATE assignments SET title_ar = ?, description_ar = COALESCE(?, description_ar), image_url = COALESCE(?, image_url) WHERE id = ?',
        [lessonTitle, content_text || null, content_url || null, lesson.assignment_id],
      );
    }
    if (lesson.exam_id) {
      await pool.query(
        'UPDATE exams SET title_ar = ? WHERE id = ?',
        [lessonTitle, lesson.exam_id],
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الدرس' });
  }
});

router.delete('/lessons/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM course_lessons WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'الدرس غير موجود' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الدرس' });
  }
});

module.exports = router;
