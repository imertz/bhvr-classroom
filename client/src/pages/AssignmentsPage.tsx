import { useState } from 'react';
import { useAssignments, useClasses, useCreateAssignment, useDeleteAssignment } from '../hooks/queries';
import { Button } from '../components/ui/button';
import type { Assignment, AssignmentInput } from 'shared/dist';

export default function AssignmentsPage() {
  const { data: assignments = [], isLoading: loadingAssignments, error: assignmentsError } = useAssignments();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  const loading = loadingAssignments || loadingClasses;
  const error = assignmentsError || createAssignmentMutation.error || deleteAssignmentMutation.error;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AssignmentInput>({
    class_id: '',
    title: '',
    description: '',
    type: 'homework',
    points_possible: 100,
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAssignmentMutation.mutateAsync(formData);
    setShowForm(false);
    setFormData({
      class_id: '',
      title: '',
      description: '',
      type: 'homework',
      points_possible: 100,
      due_date: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignmentMutation.mutateAsync(id);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getClassInfo = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.name} (${classInfo.subject})` : 'Unknown Class';
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading assignments...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <Button onClick={() => setShowForm(true)}>
          Add Assignment
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Assignment</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type === 'homework' || type === 'quiz' || type === 'test' || type === 'project') {
                      setFormData({...formData, type});
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="test">Test</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Possible
                </label>
                <input
                  type="number"
                  value={formData.points_possible}
                  onChange={(e) => setFormData({...formData, points_possible: parseInt(e.target.value)})}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">Create Assignment</Button>
              <Button 
                type="button" 
                onClick={() => setShowForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment: Assignment) => (
              <tr key={assignment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {assignment.title}
                  </div>
                  {assignment.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {assignment.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {getClassInfo(assignment.class_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {assignment.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{assignment.points_possible}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDateTime(assignment.due_date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No assignments found. Create your first assignment!
          </div>
        )}
      </div>
    </div>
  );
}
