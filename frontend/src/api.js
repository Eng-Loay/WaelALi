const API_BASE = '/api';
const DEFAULT_TIMEOUT_MS = 12000;

async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('انتهت مهلة الاتصال بالسيرفر');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGrades() {
  return fetchJson(`${API_BASE}/grades`);
}

export async function fetchCourses(featured = false) {
  const url = featured ? `${API_BASE}/courses?featured=true` : `${API_BASE}/courses`;
  return fetchJson(url);
}

export async function fetchGradeCourses(gradeId) {
  return fetchJson(`${API_BASE}/grades/${gradeId}/courses`);
}

export async function fetchFeatures() {
  return fetchJson(`${API_BASE}/features`);
}

export async function fetchTestimonials() {
  return fetchJson(`${API_BASE}/testimonials`);
}

export async function subscribe(data) {
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Subscription failed');
  return result;
}
