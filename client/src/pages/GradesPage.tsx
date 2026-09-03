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
import {
  Cell,
  Counter,
  CounterBand,
  Field,
  RecordActions,
  RecordEmpty,
  RecordError,
  RecordHeader,
  RecordLoading,
  RecordPanel,
  RecordRow,
  RecordTable,
  ScoreBar,
} from '../components/ui/record';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../lib/utils';
import type { Grade, GradeInput } from 'shared/dist';

/** Letter standing, split from its descriptor so each can be set separately. */
const standingFor = (percentage: number) => {
  if (percentage >= 90) return { letter: 'A', note: 'Excellent' };
  if (percentage >= 80) return { letter: 'B', note: 'Good' };
  if (percentage >= 70) return { letter: 'C', note: 'Satisfactory' };
  if (percentage >= 60) return { letter: 'D', note: 'Needs work' };
  return { letter: 'F', note: 'Failing' };
};

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
  const { user } = useAuthStore();
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

    const submitData: GradeInput = {
      ...formData,
      graded_by: isTeacher && user?.id ? user.id : (formData.graded_by || user?.id || ''),
    };

    try {
      if (editingId) {
        await updateGradeMutation.mutateAsync({ id: editingId, data: submitData });
        setEditingId(null);
      } else {
        await createGradeMutation.mutateAsync(submitData);
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to submit grade:', err);
    }
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

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
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

  const standing = standingFor(averagePercentage);

  return (
    <div>
      <RecordHeader
        eyebrow="GRDS · Register"
        title={isStudent ? 'My Grades' : 'Grades'}
        subtitle={
          isStudent
            ? 'Your academic progress, scored against each assignment.'
            : 'Recorded evaluations of submitted student work.'
        }
        count={loading ? undefined : grades.length}
        countLabel="graded"
        action={
          canManageGrades && (
            <Button onClick={() => (showForm ? closeForm() : setShowForm(true))} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Add grade'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {grades.length > 0 && (
        <CounterBand>
          <Counter
            label="Graded items"
            value={grades.length}
            isLoading={loading}
            className="border-b border-rule sm:border-b-0 sm:border-r"
          />
          <Counter
            label="Average score"
            text={`${averagePercentage}%`}
            tone={averagePercentage >= 80 ? 'ink' : averagePercentage >= 70 ? 'signal' : 'alert'}
            isLoading={loading}
            className="border-b border-rule sm:border-b-0 sm:border-r"
          />
          <Counter
            label="Average standing"
            text={standing.letter}
            note={standing.note}
            isLoading={loading}
          />
        </CounterBand>
      )}

      {showForm && (
        <RecordPanel
          eyebrow={editingId ? 'Amend entry' : 'New entry'}
          title={editingId ? 'Edit grade' : 'Record a grade'}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Submission" htmlFor="grade-submission">
                <select
                  id="grade-submission"
                  value={formData.submission_id}
                  onChange={(e) => setFormData({ ...formData, submission_id: e.target.value })}
                  required
                  className="field field-select"
                >
                  <option value="">Select a submission</option>
                  {submissions
                    .filter(s => (editingId ? true : s.status !== 'graded' || s.id === formData.submission_id))
                    .map(submission => (
                      <option key={submission.id} value={submission.id}>
                        {getSubmissionInfo(submission.id)}
                      </option>
                    ))}
                </select>
              </Field>

              <Field index={2} label="Points earned" htmlFor="grade-points">
                <input
                  id="grade-points"
                  type="number"
                  value={formData.points_earned}
                  onChange={(e) => setFormData({ ...formData, points_earned: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  max={formData.submission_id ? getAssignmentPoints(formData.submission_id) : undefined}
                  className="field"
                />
                {formData.submission_id && (
                  <p className="micro mt-3">
                    Out of {getAssignmentPoints(formData.submission_id)} points
                  </p>
                )}
              </Field>

              {!isTeacher && (
                <Field index={3} label="Graded by" htmlFor="grade-teacher">
                  <select
                    id="grade-teacher"
                    value={formData.graded_by}
                    onChange={(e) => setFormData({ ...formData, graded_by: e.target.value })}
                    required
                    className="field field-select"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field index={4} label="Feedback" htmlFor="grade-feedback" className="md:col-span-2">
                <textarea
                  id="grade-feedback"
                  value={formData.feedback || ''}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={4}
                  className="field field-box"
                  placeholder="Enter feedback for the student…"
                />
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button
                type="submit"
                disabled={createGradeMutation.isPending || updateGradeMutation.isPending}
              >
                {editingId ? 'Update grade' : 'Record grade'}
              </Button>
              <Button type="button" onClick={closeForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      {loading ? (
        <RecordLoading label="Reading the grade register" />
      ) : grades.length === 0 ? (
        <RecordEmpty label="No grades on record">
          {isStudent
            ? 'Nothing has been graded against your account yet.'
            : 'No work has been evaluated yet. Recorded grades appear here.'}
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Assignment & student', width: 30 },
            { label: 'Score', width: 10 },
            { label: 'Percentage', width: 16 },
            { label: 'Graded by', width: 16 },
            { label: 'Graded at', width: 16 },
            ...(canManageGrades ? [{ label: null, width: 12 }] : []),
          ]}
        >
          {grades.map((grade: Grade, i) => {
            const maxPoints = getAssignmentPoints(grade.submission_id);
            const percentage = calculatePercentage(grade.points_earned, maxPoints);

            return (
              <RecordRow
                key={grade.id}
                index={i}
                isPending={
                  deleteGradeMutation.isPending && deleteGradeMutation.variables === grade.id
                }
              >
                <Cell tone="primary" title={grade.feedback || undefined}>
                  {getSubmissionInfo(grade.submission_id)}
                  {grade.feedback && (
                    <span className="mt-1 block truncate text-[0.8125rem] font-normal tracking-normal text-muted-foreground">
                      {grade.feedback}
                    </span>
                  )}
                </Cell>
                <Cell tone="numeral" className="whitespace-nowrap">
                  {grade.points_earned}/{maxPoints}
                </Cell>
                <Cell className="overflow-visible">
                  <ScoreBar percentage={percentage} />
                </Cell>
                <Cell>{getTeacherName(grade.graded_by)}</Cell>
                <Cell tone="numeral">{formatDateTime(grade.graded_at)}</Cell>
                {canManageGrades && (
                  <RecordActions
                    onEdit={() => handleEdit(grade)}
                    onDelete={() => handleDelete(grade.id)}
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
