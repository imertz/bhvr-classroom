import { Link } from 'react-router-dom';
import { useStudents, useDeleteStudent } from '../hooks/queries';
import { Button } from '../components/ui/button';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../lib/utils';
import type { Student } from 'shared/dist';

export default function StudentsPage() {
  const { data: students = [], isLoading: loading, error } = useStudents();
  const deleteStudentMutation = useDeleteStudent();
  const { canCreate, canEdit, canDelete, isAuthenticated } = usePermissions();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await deleteStudentMutation.mutateAsync(id);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Loading students...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        {canCreate && (
          <Button asChild>
            <Link to="/students/new">Add Student</Link>
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error instanceof Error ? error.message : 'An error occurred'}
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
                Grade Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Birth
              </th>
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student: Student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{student.grade_level}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(student.date_of_birth)}
                  </div>
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {canEdit && (
                      <Link 
                        to={`/students/${student.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No students found.{' '}
            {canCreate ? (
              <Link to="/students/new" className="text-indigo-600 hover:text-indigo-900">
                Add the first student
              </Link>
            ) : isAuthenticated ? (
              <span>Contact an administrator to add students.</span>
            ) : (
              <Link to="/login" className="text-indigo-600 hover:text-indigo-900">
                Login to manage students
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
