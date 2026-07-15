const API_BASE = '/api/student';

let redirectingToLogin = false;

function getToken() {
  return localStorage.getItem('student_token');
}

function clearStudentSession() {
  localStorage.removeItem('student_token');
  localStorage.removeItem('student_user');
}

function redirectToLoginOnce() {
  if (redirectingToLogin) return;
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  if (path.includes('/login') || path.includes('/student/login')) return;
  redirectingToLogin = true;
  clearStudentSession();
  window.location.assign('/login');
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
  if (!res.ok) {
    const isAuthCall = path.includes('/auth/login') || path.includes('/auth/register');
    if (!isAuthCall && res.status === 401) {
      redirectToLoginOnce();
    }
    throw new Error(data.message || 'Request failed');
  }
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
  redirectingToLogin = false;
  return saveSession(await studentFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }));
}

export async function studentRegister(payload) {
  redirectingToLogin = false;
  return saveSession(await studentFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export function studentLogout() {
  clearStudentSession();
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

export async function submitStudentAssignment(id, body) {
  return studentFetch(`/assignments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function uploadStudentFile(file, kind = 'pdf') {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`/api/student/upload/${kind}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) redirectToLoginOnce();
    throw new Error(data.message || 'فشل رفع الملف');
  }
  return data.data.url;
}

export async function fetchStudentExams() {
  return studentFetch('/exams');
}

export async function fetchStudentExam(id) {
  return studentFetch(`/exams/${id}`);
}
