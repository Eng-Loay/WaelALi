const API_BASE = "/api/admin";

let redirectingToLogin = false;

function getToken() {
  return localStorage.getItem("admin_token");
}

function clearAdminSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

function redirectToLoginOnce() {
  if (redirectingToLogin) return;
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  if (path.includes("/login") || path.endsWith("/login")) return;
  redirectingToLogin = true;
  clearAdminSession();
  window.location.assign("/login");
}

function isAuthFailure(res, data) {
  if (res.status !== 401) return false;
  const msg = String(data?.message || "");
  return (
    msg.includes("انتهت الجلسة") ||
    msg.includes("غير مصرح") ||
    msg.toLowerCase().includes("unauthorized") ||
    !msg
  );
}

export async function adminFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const isLoginCall = path.includes("/auth/login");
    if (!isLoginCall && isAuthFailure(res, data)) {
      redirectToLoginOnce();
    }
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function adminLogin(email, password) {
  redirectingToLogin = false;
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

/** Renew token so the session stays valid across deploys/restarts.
 * Returns:
 * - data on success
 * - null on auth failure (logged out)
 * - { deferred: true } on network/server errors (keep existing token)
 */
export async function refreshAdminSession() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      clearAdminSession();
      return null;
    }
    if (!res.ok) {
      return { deferred: true };
    }

    if (data.data?.accessToken) {
      localStorage.setItem("admin_token", data.data.accessToken);
    }
    if (data.data?.user) {
      localStorage.setItem(
        "admin_user",
        JSON.stringify({
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role || "admin",
        }),
      );
    }
    return data.data;
  } catch {
    // API briefly down during deploy — keep the current session
    return { deferred: true };
  }
}

export function adminLogout() {
  clearAdminSession();
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

export async function fetchAdminStudents(courseId) {
  const path = courseId ? `/students?course_id=${courseId}` : "/students";
  return adminFetch(path);
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
