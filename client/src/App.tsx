import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthProvider';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeachersPage from './pages/TeachersPage';
import TeacherFormPage from './pages/TeacherFormPage';
import StudentsPage from './pages/StudentsPage';
import StudentFormPage from './pages/StudentFormPage';
import ClassesPage from './pages/ClassesPage';
import ClassFormPage from './pages/ClassFormPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AttendancePage from './pages/AttendancePage';
import GradesPage from './pages/GradesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SubmissionsPage from './pages/SubmissionsPage';
import EnrollmentsPage from './pages/EnrollmentsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="teachers/new" element={<TeacherFormPage />} />
            <Route path="teachers/:id/edit" element={<TeacherFormPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/new" element={<StudentFormPage />} />
            <Route path="students/:id/edit" element={<StudentFormPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/new" element={<ClassFormPage />} />
            <Route path="classes/:id/edit" element={<ClassFormPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="grades" element={<GradesPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;