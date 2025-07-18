import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/teachers', label: 'Teachers' },
    { path: '/students', label: 'Students' },
    { path: '/classes', label: 'Classes' },
    { path: '/assignments', label: 'Assignments' },
    { path: '/announcements', label: 'Announcements' },
    { path: '/submissions', label: 'Submissions' },
    { path: '/enrollments', label: 'Enrollments' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/grades', label: 'Grades' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-xl font-bold text-indigo-600">
              📚 Classroom Manager
            </div>
          </Link>
          
          <div className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => (
              <Button
                key={item.path}
                asChild
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap"
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
