import { adminLogin, adminLogout, getAdminUser, isAdminLoggedIn } from './adminApi';
import { studentLogin, studentLogout, getStudentUser, isStudentLoggedIn } from './studentApi';

export const AUTH_EVENT = 'wael-auth-changed';

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function unifiedLogin(email, password) {
  adminLogout();
  studentLogout();

  try {
    const adminResult = await adminLogin(email, password);
    notifyAuthChange();
    return { role: 'admin', ...adminResult };
  } catch {
    // not an admin account — try student
  }

  const studentResult = await studentLogin(email, password);
  notifyAuthChange();
  return { role: 'student', ...studentResult };
}

export function unifiedLogout() {
  adminLogout();
  studentLogout();
  notifyAuthChange();
}

export function getActiveSession() {
  if (isAdminLoggedIn()) {
    const user = getAdminUser();
    return {
      role: 'admin',
      path: '/admin/dashboard',
      labelKey: 'dashboardAdmin',
      name: user?.name || 'Admin',
      user,
    };
  }
  if (isStudentLoggedIn()) {
    const user = getStudentUser();
    return {
      role: 'student',
      path: '/student/dashboard',
      labelKey: 'dashboardStudent',
      name: user?.name || 'Student',
      user,
    };
  }
  return null;
}
