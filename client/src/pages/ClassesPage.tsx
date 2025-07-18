import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClassStore } from '../stores';
import { Button } from '../components/ui/button';
import type { Class } from 'shared/dist';

export default function ClassesPage() {
  const { 
    classes, 
    loading, 
    error, 
    fetchClasses, 
    deleteClass, 
    clearError 
  } = useClassStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClass(id);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Loading classes...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Classes</h1>
        <Button asChild>
          <Link to="/classes/new">Add Class</Link>
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
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((classItem: Class) => (
              <tr key={classItem.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {classItem.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{classItem.subject}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{classItem.teacher_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{classItem.room_number || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link 
                    to={`/classes/${classItem.id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/classes/${classItem.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(classItem.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {classes.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No classes found. <Link to="/classes/new" className="text-indigo-600 hover:text-indigo-900">Add the first class</Link>
          </div>
        )}
      </div>
    </div>
  );
}
