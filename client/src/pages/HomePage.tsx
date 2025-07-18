import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Classroom Management System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Teachers</h2>
          <p className="text-gray-600 mb-4">Manage teacher profiles and information</p>
          <Button asChild>
            <Link to="/teachers">View Teachers</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Students</h2>
          <p className="text-gray-600 mb-4">Manage student profiles and enrollment</p>
          <Button asChild>
            <Link to="/students">View Students</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Classes</h2>
          <p className="text-gray-600 mb-4">Manage class schedules and subjects</p>
          <Button asChild>
            <Link to="/classes">View Classes</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Assignments</h2>
          <p className="text-gray-600 mb-4">Create and manage assignments</p>
          <Button asChild>
            <Link to="/assignments">View Assignments</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Attendance</h2>
          <p className="text-gray-600 mb-4">Track student attendance</p>
          <Button asChild>
            <Link to="/attendance">View Attendance</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Grades</h2>
          <p className="text-gray-600 mb-4">Manage student grades and assessments</p>
          <Button asChild>
            <Link to="/grades">View Grades</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
