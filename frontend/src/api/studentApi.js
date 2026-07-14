const API_BASE = '/api/student';

function getToken() {
  return localStorage.getItem('student_token');
}

async function studentFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function saveSession(result) {
  if (result.data?.accessToken) {
    localStorage.setItem('student_token', result.data.accessToken);
    localStorage.setItem('student_user', JSON.stringify(result.data.user));
  }
  return result;
}

export async function studentLogin(email, password) {
  return saveSession(await studentFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }));
}

export async function studentRegister(payload) {
  return saveSession(await studentFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export function studentLogout() {
  localStorage.removeItem('student_token');
  localStorage.removeItem('student_user');
}

export function getStudentUser() {
  try {
    return JSON.parse(localStorage.getItem('student_user') || 'null');
  } catch {
    return null;
  }
}

export function isStudentLoggedIn() {
  return Boolean(getToken());
}

export async function fetchStudentOverview() {
  return studentFetch('/overview');
}

export async function fetchStudentCourses() {
  return studentFetch('/courses');
}

export async function fetchAvailableCourses() {
  return studentFetch('/available-courses');
}

export async function enrollCourse(courseId) {
  return studentFetch(`/enroll/${courseId}`, { method: 'POST' });
}

export async function updateCourseProgress(courseId, progress) {
  return studentFetch(`/courses/${courseId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progress }),
  });
}

export async function fetchStudentAssignments() {
  return studentFetch('/assignments');
}

export async function fetchStudentAssignment(id) {
  return studentFetch(`/assignments/${id}`);
}

export async function fetchStudentExams() {
  return studentFetch('/exams');
}

export async function fetchStudentExam(id) {
  return studentFetch(`/exams/${id}`);
}
