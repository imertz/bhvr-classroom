import { useState } from 'react';
import { 
  useGrades, 
  useSubmissions, 
  useAssignments, 
  useStudents, 
  useTeachers, 
  useCreateGrade, 
  useUpdateGrade, 
  useDeleteGrade 
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import { usePermissions } from '../hooks/usePermissions';
import { formatDateTime } from '../lib/utils';
import type { Grade, GradeInput } from 'shared/dist';

export default function GradesPage() {
  const { data: grades = [], isLoading: loadingGrades, error: gradesError } = useGrades();
  const { data: submissions = [], isLoading: loadingSubmissions } = useSubmissions();
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();

  const createGradeMutation = useCreateGrade();
  const updateGradeMutation = useUpdateGrade();
  const deleteGradeMutation = useDeleteGrade();

  const loading = loadingGrades || loadingSubmissions || loadingAssignments || loadingStudents || loadingTeachers;
  const error = gradesError || createGradeMutation.error || updateGradeMutation.error || deleteGradeMutation.error;

  const { isAdmin, isTeacher, isStudent } = usePermissions();
  const canManageGrades = isAdmin || isTeacher;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GradeInput>({
    submission_id: '',
    points_earned: 0,
    feedback: '',
    graded_by: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateGradeMutation.mutateAsync({ id: editingId, data: formData });
      setEditingId(null);
    } else {
      await createGradeMutation.mutateAsync(formData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (grade: Grade) => {
    setEditingId(grade.id);
    setFormData({
      submission_id: grade.submission_id,
      points_earned: grade.points_earned,
      feedback: grade.feedback || '',
      graded_by: grade.graded_by,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      submission_id: '',
      points_earned: 0,
      feedback: '',
      graded_by: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this grade?')) {
      await deleteGradeMutation.mutateAsync(id);
    }
  };

  const getSubmissionInfo = (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return 'Unknown Submission';
    
    const assignment = assignments.find(a => a.id === submission.assignment_id);
    const student = students.find(s => s.id === submission.student_id);
    
    const assignmentTitle = assignment?.title || 'Unknown Assignment';
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
    
    return `${assignmentTitle} - ${studentName}`;
  };

  const getAssignmentPoints = (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return 0;
    
    const assignment = assignments.find(a => a.id === submission.assignment_id);
    return assignment?.points_possible || 0;
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';
  };

  const calculatePercentage = (earned: number, possible: number) => {
    if (possible === 0) return 0;
    return Math.round((earned / possible) * 100);
  };

  const averagePercentage = grades.length > 0 ? Math.round(
    grades.reduce((sum, grade) => {
      const max = getAssignmentPoints(grade.submission_id);
      return sum + calculatePercentage(grade.points_earned, max);
    }, 0) / grades.length
  ) : 0;

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading grades...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{isStudent ? 'My Grades' : 'Grades'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStudent ? 'Your academic progress and scores' : 'Track and record student assignment evaluations'}
          </p>
        </div>
        {canManageGrades && (
          <Button onClick={() => setShowForm(true)}>
            Add Grade
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {grades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Graded Items</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{grades.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Average Score</span>
            <div className={`text-2xl font-bold mt-1 ${
              averagePercentage >= 80 ? 'text-green-600' :
              averagePercentage >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {averagePercentage}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <span className="text-xs font-semibold text-gray-500 uppercase">Average Standing</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {averagePercentage >= 90 ? 'A (Excellent)' :
               averagePercentage >= 80 ? 'B (Good)' :
               averagePercentage >= 70 ? 'C (Satisfactory)' :
               averagePercentage >= 60 ? 'D (Needs Work)' : 'F'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Grade' : 'Add Grade'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission
                </label>
                <select
                  value={formData.submission_id}
                  onChange={(e) => setFormData({...formData, submission_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a submission</option>
                  {submissions.map(submission => (
                    <option key={submission.id} value={submission.id}>
                      {getSubmissionInfo(submission.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Earned
                </label>
                <input
                  type="number"
                  value={formData.points_earned}
                  onChange={(e) => setFormData({...formData, points_earned: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                  max={formData.submission_id ? getAssignmentPoints(formData.submission_id) : undefined}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.submission_id && (
                  <p className="text-sm text-gray-500 mt-1">
                    Out of {getAssignmentPoints(formData.submission_id)} points
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graded By
                </label>
                <select
                  value={formData.graded_by}
                  onChange={(e) => setFormData({...formData, graded_by: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={formData.feedback || ''}
                  onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter feedback for the student..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">
                {editingId ? 'Update' : 'Add'} Grade
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
                Assignment & Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Graded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Graded At
              </th>
              {canManageGrades && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade: Grade) => {
              const maxPoints = getAssignmentPoints(grade.submission_id);
              const percentage = calculatePercentage(grade.points_earned, maxPoints);
              
              return (
                <tr key={grade.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getSubmissionInfo(grade.submission_id)}
                    </div>
                    {grade.feedback && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        Feedback: {grade.feedback}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {grade.points_earned} / {maxPoints}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      percentage >= 90 ? 'bg-green-100 text-green-800' :
                      percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                      percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {getTeacherName(grade.graded_by)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDateTime(grade.graded_at)}
                    </div>
                  </td>
                  {canManageGrades && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(grade)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(grade.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {grades.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isStudent ? 'No grades recorded yet.' : 'No grades found. Add your first grade!'}
          </div>
        )}
      </div>
    </div>
  );
}
