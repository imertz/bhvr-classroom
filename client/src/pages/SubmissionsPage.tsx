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
import {
  Cell,
  Field,
  Marker,
  RecordActions,
  RecordEmpty,
  RecordError,
  RecordHeader,
  RecordLoading,
  RecordPanel,
  RecordRow,
  RecordTable,
} from '../components/ui/record';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import type { Submission, SubmissionInput } from 'shared/dist';

const STATUS_TONE = {
  submitted: 'signal',
  graded: 'ink',
  returned: 'mute',
} satisfies Record<string, 'mute' | 'signal' | 'ink'>;

export default function SubmissionsPage() {
  const { user } = useAuthStore();
  const { isAuthenticated, isStudent, isTeacher, isAdmin } = usePermissions();

  const { data: submissions = [], isLoading: loadingSubmissions, error: submissionsError } = useSubmissions();
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const createSubmissionMutation = useCreateSubmission();
  const updateSubmissionMutation = useUpdateSubmission();
  const deleteSubmissionMutation = useDeleteSubmission();

  const loading = loadingSubmissions || loadingAssignments || loadingStudents;
  const error = submissionsError || createSubmissionMutation.error || updateSubmissionMutation.error || deleteSubmissionMutation.error;

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

    const dataToSubmit: SubmissionInput = {
      ...formData,
      student_id: isStudent && user?.id ? user.id : formData.student_id,
    };

    if (editingId) {
      await updateSubmissionMutation.mutateAsync({ id: editingId, data: dataToSubmit });
      setEditingId(null);
    } else {
      await createSubmissionMutation.mutateAsync(dataToSubmit);
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
      student_id: isStudent && user?.id ? user.id : '',
      content: '',
      status: 'submitted',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      await deleteSubmissionMutation.mutateAsync(id);
    }
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
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

  const isOverdue = (assignmentId: string, submittedAt: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return false;

    return new Date(submittedAt) > new Date(assignment.due_date);
  };

  return (
    <div>
      <RecordHeader
        eyebrow="SUBM · Register"
        title={isStudent ? 'My Submissions' : 'Submissions'}
        subtitle={
          isStudent
            ? 'Your submitted coursework and evaluations.'
            : 'Review and track submitted student work.'
        }
        count={loading ? undefined : submissions.length}
        countLabel="handed in"
        action={
          isAuthenticated && (
            <Button onClick={() => (showForm ? closeForm() : openForm())} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Add submission'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {showForm && (
        <RecordPanel
          eyebrow={editingId ? 'Amend entry' : 'New entry'}
          title={editingId ? 'Edit submission' : 'Record a submission'}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Assignment" htmlFor="submission-assignment">
                <select
                  id="submission-assignment"
                  value={formData.assignment_id}
                  onChange={(e) => setFormData({ ...formData, assignment_id: e.target.value })}
                  required
                  className="field field-select"
                >
                  <option value="">Select an assignment</option>
                  {assignments.map(assignment => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title} (Due: {new Date(assignment.due_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </Field>

              <Field index={2} label="Student" htmlFor="submission-student">
                {isStudent ? (
                  <input
                    id="submission-student"
                    type="text"
                    value={user ? `${user.firstName} ${user.lastName}` : 'Current Student'}
                    disabled
                    className="field cursor-not-allowed opacity-80"
                  />
                ) : (
                  <select
                    id="submission-student"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                    className="field field-select"
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field index={3} label="Status" htmlFor="submission-status">
                <select
                  id="submission-status"
                  value={formData.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === 'submitted' || status === 'graded' || status === 'returned') {
                      setFormData({ ...formData, status });
                    }
                  }}
                  className="field field-select"
                >
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="returned">Returned</option>
                </select>
              </Field>

              <Field index={4} label="Content" htmlFor="submission-content" className="md:col-span-2">
                <textarea
                  id="submission-content"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="field field-box"
                  placeholder="Enter submission content…"
                />
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button
                type="submit"
                disabled={createSubmissionMutation.isPending || updateSubmissionMutation.isPending}
              >
                {editingId ? 'Update submission' : 'Record submission'}
              </Button>
              <Button type="button" onClick={closeForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      {loading ? (
        <RecordLoading label="Reading submission records" />
      ) : submissions.length === 0 ? (
        <RecordEmpty label="No submissions on record">
          Nothing has been handed in yet. Submitted work will be listed here.
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Assignment', width: 22 },
            { label: 'Student', width: 18 },
            { label: 'Status', width: 14 },
            { label: 'Submitted', width: 18 },
            { label: 'Content', width: 18 },
            ...(isAuthenticated ? [{ label: null, width: 14 }] : []),
          ]}
        >
          {submissions.map((submission: Submission, i) => {
            const status = submission.status || 'submitted';
            const late = isOverdue(submission.assignment_id, submission.submitted_at);
            const canManage = isAdmin || isTeacher || (isStudent && submission.student_id === user?.id);

            return (
              <RecordRow
                key={submission.id}
                index={i}
                isPending={
                  deleteSubmissionMutation.isPending &&
                  deleteSubmissionMutation.variables === submission.id
                }
              >
                <Cell tone="primary">{getAssignmentInfo(submission.assignment_id)}</Cell>
                <Cell tone="secondary">{getStudentName(submission.student_id)}</Cell>
                <Cell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <Marker tone={STATUS_TONE[status]}>{status}</Marker>
                    {late && <Marker tone="alert">Late</Marker>}
                  </span>
                </Cell>
                <Cell tone="numeral">{formatDateTime(submission.submitted_at)}</Cell>
                <Cell title={submission.content || undefined}>
                  {submission.content || '—'}
                </Cell>
                {canManage && (
                  <RecordActions
                    onEdit={() => handleEdit(submission)}
                    onDelete={() => handleDelete(submission.id)}
                  />
                )}
              </RecordRow>
            );
          })}
        </RecordTable>
      )}
    </div>
  );
}
