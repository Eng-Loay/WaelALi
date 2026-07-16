import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import GradesPage from "./pages/GradesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Courses from "./pages/Courses";
import AdminLayout from "./admin/AdminLayout";
import AdminProtected from "./admin/AdminProtected";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseContent from "./pages/admin/AdminCourseContent";
import AdminGrades from "./pages/admin/AdminGrades";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminAssignmentSubmissions from "./pages/admin/AdminAssignmentSubmissions";
import AdminExams from "./pages/admin/AdminExams";
import AdminExamResults from "./pages/admin/AdminExamResults";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminAttendanceCourse from "./pages/admin/AdminAttendanceCourse";
import UnifiedLogin from "./pages/UnifiedLogin";
import StudentProtected from "./student/StudentProtected";
import StudentLayout from "./student/StudentLayout";
import StudentRegister from "./pages/student/StudentRegister";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseView from "./pages/student/StudentCourseView";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentExams from "./pages/student/StudentExams";

function CourseSectionsRedirect() {
  const { courseId } = useParams();
  return <Navigate to={`/admin/courses/${courseId}/content`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/grades/:stage" element={<GradesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:gradeId" element={<Courses />} />

        <Route path="/login" element={<UnifiedLogin />} />
        <Route
          path="/student/login"
          element={<Navigate to="/login" replace />}
        />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student" element={<StudentProtected />}>
          <Route element={<StudentLayout />}>
            <Route
              index
              element={<Navigate to="/student/dashboard" replace />}
            />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:courseId" element={<StudentCourseView />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="exams" element={<StudentExams />} />
          </Route>
        </Route>

        <Route path="/admin" element={<AdminProtected />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/:courseId/content" element={<AdminCourseContent />} />
            <Route path="courses/:courseId/sections" element={<CourseSectionsRedirect />} />
            <Route path="grades" element={<AdminGrades />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="assignments/submissions" element={<AdminAssignmentSubmissions />} />
            <Route path="assignments/:assignmentId/submissions" element={<AdminAssignmentSubmissions />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="exams/results" element={<AdminExamResults />} />
            <Route path="exams/:examId/results" element={<AdminExamResults />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="subscribers" element={<AdminSubscribers />} />
            <Route path="students/:studentId" element={<AdminStudentDetail />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="attendance/:courseId" element={<AdminAttendanceCourse />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
