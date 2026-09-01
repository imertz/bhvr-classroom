import { useState } from 'react';
import { 
  useSubmissions, 
  useAssignments, 
  useStudents, 
  useCreateSubmission, 
  useUpdateSubmission, 
  useDeleteSubmission 
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import type { Submission, SubmissionInput } from 'shared/dist';

export default function SubmissionsPage() {
  const { data: submissions = [], isLoading: loadingSubmissions, error: submissionsError } = useSubmissions();
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const createSubmissionMutation = useCreateSubmission();
  const updateSubmissionMutation = useUpdateSubmission();
  const deleteSubmissionMutation = useDeleteSubmission();

  const loading = loadingSubmissions || loadingAssignments || loadingStudents;
  const error = (submissionsError || createSubmissionMutation.error || updateSubmissionMutation.error || deleteSubmissionMutation.error) as Error | null;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubmissionInput>({
    assignment_id: '',
    student_id: '',
    content: '',
    status: 'submitted',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateSubmissionMutation.mutateAsync({ id: editingId, data: formData });
      setEditingId(null);
    } else {
      await createSubmissionMutation.mutateAsync(formData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setFormData({
      assignment_id: submission.assignment_id,
      student_id: submission.student_id,
      content: submission.content || '',
      status: submission.status || 'submitted',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      assignment_id: '',
      student_id: '',
      content: '',
      status: 'submitted',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      await deleteSubmissionMutation.mutateAsync(id);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAssignmentInfo = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    return assignment ? assignment.title : 'Unknown Assignment';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (assignmentId: string, submittedAt: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return false;
    
    return new Date(submittedAt) > new Date(assignment.due_date);
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading submissions...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <Button onClick={() => setShowForm(true)}>
          Create Submission
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Submission' : 'Create Submission'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment
                </label>
                <select
                  value={formData.assignment_id}
                  onChange={(e) => setFormData({...formData, assignment_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an assignment</option>
                  {assignments.map(assignment => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title} (Due: {new Date(assignment.due_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as NonNullable<SubmissionInput['status']>})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter submission content..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">
                {editingId ? 'Update' : 'Create'} Submission
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
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
                Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission: Submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getAssignmentInfo(submission.assignment_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getStudentName(submission.student_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status || 'submitted')}`}>
                    {submission.status || 'submitted'}
                  </span>
                  {isOverdue(submission.assignment_id, submission.submitted_at) && (
                    <div className="text-xs text-red-500 mt-1">Late</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDateTime(submission.submitted_at)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {submission.content || 'No content'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(submission)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(submission.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {submissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No submissions found. Create your first submission!
          </div>
        )}
      </div>
    </div>
  );
}
