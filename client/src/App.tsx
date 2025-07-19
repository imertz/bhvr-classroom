import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthProvider';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
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
          <Route path="/register" element={<RegistrationPage />} />
          
          {/* Public and protected routes */}
          <Route path="/" element={<Layout />}>
            {/* Public read-only access to list pages */}
            <Route index element={<HomePage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="grades" element={<GradesPage />} />
            
            {/* Protected form routes - require authentication */}
            <Route path="teachers/new" element={
              <ProtectedRoute>
                <TeacherFormPage />
              </ProtectedRoute>
            } />
            <Route path="teachers/:id/edit" element={
              <ProtectedRoute>
                <TeacherFormPage />
              </ProtectedRoute>
            } />
            <Route path="students/new" element={
              <ProtectedRoute>
                <StudentFormPage />
              </ProtectedRoute>
            } />
            <Route path="students/:id/edit" element={
              <ProtectedRoute>
                <StudentFormPage />
              </ProtectedRoute>
            } />
            <Route path="classes/new" element={
              <ProtectedRoute>
                <ClassFormPage />
              </ProtectedRoute>
            } />
            <Route path="classes/:id/edit" element={
              <ProtectedRoute>
                <ClassFormPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;