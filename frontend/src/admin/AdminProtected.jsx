import { Navigate, Outlet } from 'react-router-dom';
import { isAdminLoggedIn } from '../api/adminApi';

export default function AdminProtected() {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
