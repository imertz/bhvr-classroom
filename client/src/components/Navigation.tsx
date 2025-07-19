import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthStore();
  const { isAuthenticated } = usePermissions();

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Navigate to login anyway
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-xl font-bold text-indigo-600">
              📚 Classroom Manager
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
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

            {/* User Info and Auth Actions */}
            <div className="flex items-center space-x-3 border-l pl-4">
              {isAuthenticated ? (
                <>
                  {user && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">
                        {user.email}
                      </span>
                      <span className="block text-xs text-gray-500 capitalize">
                        {user.role}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleLogout}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Logout'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Link to="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
