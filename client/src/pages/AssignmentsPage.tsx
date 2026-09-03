import { useState } from 'react';
import { useAssignments, useClasses, useCreateAssignment, useDeleteAssignment } from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Cell,
  Field,
  Marker,
  RecordEmpty,
  RecordError,
  RecordHeader,
  RecordLoading,
  RecordPanel,
  RecordRow,
  RecordTable,
} from '../components/ui/record';
import { usePermissions } from '../hooks/usePermissions';
import { formatDateTime } from '../lib/utils';
import type { Assignment, AssignmentInput } from 'shared/dist';

/** Assignment types read as stamps; the graded ones carry more weight. */
const TYPE_TONE = {
  homework: 'mute',
  quiz: 'signal',
  test: 'ink',
  project: 'signal',
} satisfies Record<string, 'mute' | 'signal' | 'ink'>;

export default function AssignmentsPage() {
  const { canCreate, canDelete, isStudent } = usePermissions();
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

  const getClassInfo = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.name} (${classInfo.subject})` : 'Unknown Class';
  };

  return (
    <div>
      <RecordHeader
        eyebrow="ASGN · Register"
        title={isStudent ? 'My Assignments' : 'Assignments'}
        subtitle={
          isStudent
            ? 'Your coursework, homework, projects and deadlines.'
            : 'Set homework, projects and deadlines.'
        }
        count={loading ? undefined : assignments.length}
        countLabel="set"
        action={
          canCreate && (
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Add assignment'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {showForm && (
        <RecordPanel eyebrow="New entry" title="Create an assignment">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Class" htmlFor="assignment-class">
                <select
                  id="assignment-class"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                  className="field field-select"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </Field>

              <Field index={2} label="Title" htmlFor="assignment-title">
                <input
                  id="assignment-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="field"
                  placeholder="Chapter 4 problem set"
                />
              </Field>

              <Field index={3} label="Type" htmlFor="assignment-type">
                <select
                  id="assignment-type"
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type === 'homework' || type === 'quiz' || type === 'test' || type === 'project') {
                      setFormData({ ...formData, type });
                    }
                  }}
                  className="field field-select"
                >
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="test">Test</option>
                  <option value="project">Project</option>
                </select>
              </Field>

              <Field index={4} label="Points possible" htmlFor="assignment-points">
                <input
                  id="assignment-points"
                  type="number"
                  value={formData.points_possible}
                  onChange={(e) => setFormData({ ...formData, points_possible: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="field"
                />
              </Field>

              <Field index={5} label="Due date" htmlFor="assignment-due">
                <input
                  id="assignment-due"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  className="field"
                />
              </Field>

              <Field index={6} label="Description" htmlFor="assignment-description" className="md:col-span-2">
                <textarea
                  id="assignment-description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="field field-box"
                  placeholder="Optional notes for students"
                />
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button type="submit" disabled={createAssignmentMutation.isPending}>
                {createAssignmentMutation.isPending ? 'Creating…' : 'Create assignment'}
              </Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      {loading ? (
        <RecordLoading label="Reading assignment records" />
      ) : assignments.length === 0 ? (
        <RecordEmpty label="No assignments set">
          Nothing has been assigned yet. Create the first entry to open the register.
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Title', width: 26 },
            { label: 'Class', width: 22 },
            { label: 'Type', width: 12 },
            { label: 'Points', width: 8 },
            { label: 'Due', width: 18 },
            ...(canDelete ? [{ label: null, width: 10 }] : []),
          ]}
        >
          {assignments.map((assignment: Assignment, i) => (
            <RecordRow
              key={assignment.id}
              index={i}
              isPending={
                deleteAssignmentMutation.isPending &&
                deleteAssignmentMutation.variables === assignment.id
              }
            >
              <Cell tone="primary" title={assignment.description || undefined}>
                {assignment.title}
                {assignment.description && (
                  <span className="mt-1 block truncate text-[0.8125rem] font-normal tracking-normal text-muted-foreground">
                    {assignment.description}
                  </span>
                )}
              </Cell>
              <Cell>{getClassInfo(assignment.class_id)}</Cell>
              <Cell>
                <Marker tone={TYPE_TONE[assignment.type]}>{assignment.type}</Marker>
              </Cell>
              <Cell tone="numeral">{assignment.points_possible}</Cell>
              <Cell tone="numeral">{formatDateTime(assignment.due_date)}</Cell>
              {canDelete && (
                <td className="py-4 pr-6 text-right align-middle sm:pr-8 lg:pr-12">
                  <button
                    type="button"
                    onClick={() => handleDelete(assignment.id)}
                    className="micro transition-colors duration-100 hover:text-destructive focus-visible:text-destructive"
                  >
                    Delete
                  </button>
                </td>
              )}
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </div>
  );
}
