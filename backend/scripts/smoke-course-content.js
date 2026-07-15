require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const base = `http://127.0.0.1:${process.env.PORT || 5000}`;

  const loginRes = await fetch(`${base}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@waelalimath.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok) throw new Error(login.message || 'login failed');
  const token = login.data.accessToken;

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wael_ali_math',
  });
  const [courses] = await conn.query('SELECT id FROM courses ORDER BY id LIMIT 1');
  await conn.end();
  if (!courses.length) throw new Error('no courses');
  const courseId = courses[0].id;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  async function api(method, path, body) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${path}: ${json.message || res.status}`);
    return json;
  }

  const content = await api('GET', `/api/admin/course-content/${courseId}/content`);
  console.log('Loaded sections:', content.data.sections.length);
  const sectionId = content.data.sections[0].id;

  const section = await api('POST', `/api/admin/course-content/${courseId}/sections`, {});
  console.log('Created section', section.data.id);

  const created = [];

  const text = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'text',
    title: 'درس نصي تجريبي',
    content_text: 'محتوى تجريبي للدرس',
  });
  created.push(text.data.id);
  console.log('Created text', text.data.id);

  const video = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'video',
    title: 'فيديو تجريبي',
    content_url: 'https://example.com/video.mp4',
  });
  created.push(video.data.id);
  console.log('Created video', video.data.id);

  const record = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'record',
    title: 'تسجيل تجريبي',
    content_url: 'https://example.com/audio.mp3',
  });
  created.push(record.data.id);
  console.log('Created record', record.data.id);

  const pdf = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'pdf',
    title: 'PDF تجريبي',
    content_url: 'https://example.com/file.pdf',
  });
  created.push(pdf.data.id);
  console.log('Created pdf', pdf.data.id);

  const assignment = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'assignment',
    title: 'واجب تجريبي',
    content_text: 'وصف الواجب',
  });
  created.push(assignment.data.id);
  console.log('Created assignment', assignment.data.id);

  const quiz = await api('POST', `/api/admin/course-content/${courseId}/lessons`, {
    section_id: sectionId,
    lesson_type: 'quiz',
    title: 'اختبار تجريبي',
    duration_minutes: 20,
    questions: [
      {
        question_text: '2+2=؟',
        options: ['3', '4', '5', '6'],
        correct_answer: '4',
      },
    ],
  });
  created.push(quiz.data.id);
  console.log('Created quiz', quiz.data.id);

  await api('PUT', `/api/admin/course-content/lessons/${text.data.id}`, {
    title: 'درس نصي محدّث',
    content_text: 'نص محدّث',
  });
  console.log('Updated text lesson OK');

  await api('PUT', `/api/admin/course-content/sections/${section.data.id}`, {
    title_ar: 'قسم محدّث',
  });
  console.log('Updated section OK');

  for (const id of created) {
    await api('DELETE', `/api/admin/course-content/lessons/${id}`);
  }
  console.log('Deleted lessons OK');

  await api('DELETE', `/api/admin/course-content/sections/${section.data.id}`);
  console.log('Deleted section OK');

  console.log('Smoke test passed');
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});
