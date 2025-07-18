import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TeachersPage from './pages/TeachersPage';
import TeacherFormPage from './pages/TeacherFormPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AttendancePage from './pages/AttendancePage';
import GradesPage from './pages/GradesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SubmissionsPage from './pages/SubmissionsPage';
import EnrollmentsPage from './pages/EnrollmentsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="teachers/new" element={<TeacherFormPage />} />
          <Route path="teachers/:id/edit" element={<TeacherFormPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="enrollments" element={<EnrollmentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="grades" element={<GradesPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;