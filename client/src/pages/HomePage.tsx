import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';

export default function HomePage() {
  const { user } = useAuthStore();
  const { isAuthenticated, isAdmin, isTeacher, isStudent } = usePermissions();

  const getGreeting = () => {
    if (!isAuthenticated || !user) return 'Welcome to Classroom Manager';
    const name = user.firstName ? `${user.firstName}` : user.email.split('@')[0];
    if (isAdmin) return `Welcome, Administrator ${name}`;
    if (isTeacher) return `Welcome, Teacher ${name}`;
    return `Welcome back, ${name}!`;
  };

  const getSubtitle = () => {
    if (isStudent) return 'Track your classes, assignments, grades, and attendance';
    if (isTeacher) return 'Manage your courses, grade assignments, and track student attendance';
    if (isAdmin) return 'Complete school administration and classroom management';
    return 'Comprehensive school management solution for teachers, students, and administrators';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{getGreeting()}</h1>
        <p className="text-lg text-gray-600">{getSubtitle()}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teachers Card - Admin only */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">👨‍🏫 Teachers</h2>
            <p className="text-gray-600 mb-4">Manage teacher accounts, roles, and profiles</p>
            <Button asChild className="w-full">
              <Link to="/teachers">Manage Teachers</Link>
            </Button>
          </div>
        )}
        
        {/* Students Card - Admin / Teacher */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-green-600">👨‍🎓 Students</h2>
            <p className="text-gray-600 mb-4">Manage student records, credentials, and profiles</p>
            <Button asChild className="w-full">
              <Link to="/students">Manage Students</Link>
            </Button>
          </div>
        )}
        
        {/* Classes Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-purple-600">🏛️ {isStudent ? 'My Classes' : 'Classes'}</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'View your enrolled classes and schedules' : 'Manage class schedules and subjects'}
          </p>
          <Button asChild className="w-full">
            <Link to="/classes">{isStudent ? 'View My Classes' : 'View Classes'}</Link>
          </Button>
        </div>
        
        {/* Assignments Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-orange-600">📝 {isStudent ? 'My Assignments' : 'Assignments'}</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'View assigned homework, projects, and due dates' : 'Create and manage assignments'}
          </p>
          <Button asChild className="w-full">
            <Link to="/assignments">{isStudent ? 'View Assignments' : 'Manage Assignments'}</Link>
          </Button>
        </div>
        
        {/* Announcements Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-yellow-600">📢 Announcements</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'Read updates and class announcements' : 'Publish announcements to students'}
          </p>
          <Button asChild className="w-full">
            <Link to="/announcements">View Announcements</Link>
          </Button>
        </div>
        
        {/* Submissions Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-teal-600">📤 {isStudent ? 'My Submissions' : 'Submissions'}</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'Submit homework and check submission statuses' : 'Review and track student submissions'}
          </p>
          <Button asChild className="w-full">
            <Link to="/submissions">{isStudent ? 'Submit Work' : 'Review Submissions'}</Link>
          </Button>
        </div>
        
        {/* Enrollments Card - Admin / Teacher */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-indigo-600">📋 Enrollments</h2>
            <p className="text-gray-600 mb-4">Assign students to classes and manage rosters</p>
            <Button asChild className="w-full">
              <Link to="/enrollments">Manage Enrollments</Link>
            </Button>
          </div>
        )}
        
        {/* Attendance Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-red-600">📅 {isStudent ? 'My Attendance' : 'Attendance'}</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'Review your attendance history and absences' : 'Record and track student attendance'}
          </p>
          <Button asChild className="w-full">
            <Link to="/attendance">{isStudent ? 'View Attendance' : 'Take Attendance'}</Link>
          </Button>
        </div>
        
        {/* Grades Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-pink-600">🎯 {isStudent ? 'My Grades' : 'Grades'}</h2>
          <p className="text-gray-600 mb-4">
            {isStudent ? 'Check your scores, points, and teacher feedback' : 'Grade submissions and provide feedback'}
          </p>
          <Button asChild className="w-full">
            <Link to="/grades">{isStudent ? 'View My Grades' : 'Manage Grades'}</Link>
          </Button>
        </div>
      </div>
      
      {/* Help / Guide Box */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">
          {isStudent ? 'Student Quick Guide' : 'Platform Workflow Guide'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isStudent ? (
            <>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">Assignments & Work</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                  <li>Check <strong>My Assignments</strong> for upcoming homework & due dates</li>
                  <li>Go to <strong>Submissions</strong> to upload or enter your work</li>
                  <li>Review <strong>My Grades</strong> for scores and teacher feedback</li>
                </ol>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">Stay Updated</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                  <li>Check <strong>Announcements</strong> for class updates and reminders</li>
                  <li>Review <strong>My Attendance</strong> to ensure your records are accurate</li>
                  <li>View <strong>My Classes</strong> for teacher contact and room details</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">For Administrators</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                  <li>Create and manage teacher accounts in <strong>Teachers</strong></li>
                  <li>Set up course rosters in <strong>Classes</strong> and <strong>Enrollments</strong></li>
                  <li>Manage student accounts & login credentials in <strong>Students</strong></li>
                </ol>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">For Teachers</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                  <li>Publish <strong>Assignments</strong> and broadcast <strong>Announcements</strong></li>
                  <li>Take daily classroom presence in <strong>Attendance</strong></li>
                  <li>Review student work in <strong>Submissions</strong> and enter <strong>Grades</strong></li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
