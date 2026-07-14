import { Navigate, Outlet } from 'react-router-dom';
import { isStudentLoggedIn } from '../api/studentApi';

export default function StudentProtected() {
  if (!isStudentLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
