import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Classroom Management System</h1>
        <p className="text-lg text-gray-600">Comprehensive school management solution</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">👨‍🏫 Teachers</h2>
          <p className="text-gray-600 mb-4">Manage teacher profiles and information</p>
          <Button asChild className="w-full">
            <Link to="/teachers">View Teachers</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-green-600">👨‍🎓 Students</h2>
          <p className="text-gray-600 mb-4">Manage student profiles and information</p>
          <Button asChild className="w-full">
            <Link to="/students">View Students</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🏛️ Classes</h2>
          <p className="text-gray-600 mb-4">Manage class schedules and subjects</p>
          <Button asChild className="w-full">
            <Link to="/classes">View Classes</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">📝 Assignments</h2>
          <p className="text-gray-600 mb-4">Create and manage assignments</p>
          <Button asChild className="w-full">
            <Link to="/assignments">View Assignments</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-yellow-600">📢 Announcements</h2>
          <p className="text-gray-600 mb-4">Create and manage class announcements</p>
          <Button asChild className="w-full">
            <Link to="/announcements">View Announcements</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-teal-600">📤 Submissions</h2>
          <p className="text-gray-600 mb-4">Track assignment submissions</p>
          <Button asChild className="w-full">
            <Link to="/submissions">View Submissions</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">📋 Enrollments</h2>
          <p className="text-gray-600 mb-4">Manage student class enrollments</p>
          <Button asChild className="w-full">
            <Link to="/enrollments">View Enrollments</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-red-600">📅 Attendance</h2>
          <p className="text-gray-600 mb-4">Track student attendance</p>
          <Button asChild className="w-full">
            <Link to="/attendance">View Attendance</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-pink-600">🎯 Grades</h2>
          <p className="text-gray-600 mb-4">Manage student grades and assessments</p>
          <Button asChild className="w-full">
            <Link to="/grades">View Grades</Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4 text-center">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">For Administrators</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Add teachers to the system</li>
              <li>Create classes and assign teachers</li>
              <li>Add students to the system</li>
              <li>Enroll students in classes</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">For Teachers</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Create assignments for your classes</li>
              <li>Make announcements to students</li>
              <li>Track attendance and submissions</li>
              <li>Grade assignments and provide feedback</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
