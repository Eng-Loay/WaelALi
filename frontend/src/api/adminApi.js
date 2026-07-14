const API_BASE = "/api/admin";

function getToken() {
  return localStorage.getItem("admin_token");
}

export async function adminFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function adminLogin(email, password) {
  const result = await adminFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result.data?.accessToken) {
    localStorage.setItem("admin_token", result.data.accessToken);
    localStorage.setItem("admin_user", JSON.stringify(result.data.user));
  }
  return result;
}

export function adminLogout() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

export function isAdminLoggedIn() {
  return Boolean(getToken());
}

export async function fetchDashboardOverview() {
  return adminFetch("/dashboard/overview");
}

export async function fetchDashboardCharts() {
  return adminFetch("/dashboard/charts");
}

export async function fetchAdminSubscribers() {
  return adminFetch("/subscribers");
}

export async function fetchAdminStudents() {
  return adminFetch("/students");
}

export async function lookupStudentByEmail(email) {
  const query = encodeURIComponent(email.trim());
  return adminFetch(`/students/lookup?email=${query}`);
}

export async function createAdminStudent(body) {
  return adminFetch("/students", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function enrollStudentByEmail(body) {
  return adminFetch("/students/enroll", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const adminResource = (name) => ({
  list: () => adminFetch(`/${name}`),
  get: (id) => adminFetch(`/${name}/${id}`),
  create: (body) =>
    adminFetch(`/${name}`, { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    adminFetch(`/${name}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => adminFetch(`/${name}/${id}`, { method: "DELETE" }),
});
