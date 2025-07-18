import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTeacherStore } from '../stores';
import { Button } from '../components/ui/button';
import type { Teacher } from 'shared/dist';

export default function TeachersPage() {
  const { 
    teachers, 
    loading, 
    error, 
    fetchTeachers, 
    deleteTeacher, 
    clearError 
  } = useTeacherStore();

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      await deleteTeacher(id);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Loading teachers...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teachers</h1>
        <Button asChild>
          <Link to="/teachers/new">Add Teacher</Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
          <button 
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher: Teacher) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {teacher.first_name} {teacher.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{teacher.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(teacher.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link 
                    to={`/teachers/${teacher.id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/teachers/${teacher.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {teachers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No teachers found. <Link to="/teachers/new" className="text-indigo-600 hover:text-indigo-900">Add the first teacher</Link>
          </div>
        )}
      </div>
    </div>
  );
}
