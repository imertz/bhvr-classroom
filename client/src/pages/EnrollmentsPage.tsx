import { useState } from 'react';
import {
  useEnrollments,
  useStudents,
  useClasses,
  useCreateEnrollment,
  useUpdateEnrollment,
  useDeleteEnrollment
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Cell,
  Counter,
  CounterBand,
  Field,
  Marker,
  RecordActions,
  RecordEmpty,
  RecordError,
  RecordGroup,
  RecordHeader,
  RecordLoading,
  RecordPanel,
  RecordRow,
  RecordTable,
} from '../components/ui/record';
import { usePermissions } from '../hooks/usePermissions';
import type { Enrollment, EnrollmentInput } from 'shared/dist';

const STATUS_TONE = {
  active: 'signal',
  completed: 'ink',
  dropped: 'alert',
} satisfies Record<string, 'mute' | 'signal' | 'alert' | 'ink'>;

export default function EnrollmentsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canManage = canCreate || canEdit || canDelete;
  const { data: enrollments = [], isLoading: loadingEnrollments, error: enrollmentsError } = useEnrollments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();

  const createEnrollmentMutation = useCreateEnrollment();
  const updateEnrollmentMutation = useUpdateEnrollment();
  const deleteEnrollmentMutation = useDeleteEnrollment();

  const loading = loadingEnrollments || loadingStudents || loadingClasses;
  const error = enrollmentsError || createEnrollmentMutation.error || updateEnrollmentMutation.error || deleteEnrollmentMutation.error;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnrollmentInput>({
    student_id: '',
    class_id: '',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateEnrollmentMutation.mutateAsync({ id: editingId, data: formData });
      setEditingId(null);
    } else {
      await createEnrollmentMutation.mutateAsync(formData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment.id);
    setFormData({
      student_id: enrollment.student_id,
      class_id: enrollment.class_id,
      status: enrollment.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      status: 'active',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this enrollment?')) {
      await deleteEnrollmentMutation.mutateAsync(id);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getStudentEmail = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.email || 'No email';
  };

  const getClassName = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.name} (${classInfo.subject})` : 'Unknown Class';
  };

  // Group enrollments by class for better organization
  const enrollmentsByClass: Record<string, Enrollment[]> = {};
  for (const enrollment of enrollments) {
    const className = getClassName(enrollment.class_id);
    if (!enrollmentsByClass[className]) {
      enrollmentsByClass[className] = [];
    }
    enrollmentsByClass[className].push(enrollment);
  }

  return (
    <div>
      <RecordHeader
        eyebrow="ENRL · Register"
        title="Enrollments"
        count={loading ? undefined : enrollments.length}
        countLabel="on record"
        action={
          canCreate && (
            <Button onClick={() => (showForm ? closeForm() : setShowForm(true))} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Add enrollment'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {showForm && (
        <RecordPanel
          eyebrow={editingId ? 'Amend entry' : 'New entry'}
          title={editingId ? 'Edit enrollment' : 'Add enrollment'}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Student" htmlFor="enrollment-student">
                <select
                  id="enrollment-student"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                  className="field field-select"
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.email})
                    </option>
                  ))}
                </select>
              </Field>

              <Field index={2} label="Class" htmlFor="enrollment-class">
                <select
                  id="enrollment-class"
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

              <Field index={3} label="Status" htmlFor="enrollment-status">
                <select
                  id="enrollment-status"
                  value={formData.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === 'active' || status === 'dropped' || status === 'completed') {
                      setFormData({ ...formData, status });
                    }
                  }}
                  className="field field-select"
                >
                  <option value="active">Active</option>
                  <option value="dropped">Dropped</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button
                type="submit"
                disabled={createEnrollmentMutation.isPending || updateEnrollmentMutation.isPending}
              >
                {editingId ? 'Update enrollment' : 'Add enrollment'}
              </Button>
              <Button type="button" onClick={closeForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      <CounterBand>
        <Counter
          label="Total enrollments"
          value={enrollments.length}
          isLoading={loading}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Active students"
          value={enrollments.filter(e => e.status === 'active').length}
          isLoading={loading}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Classes with students"
          value={Object.keys(enrollmentsByClass).length}
          isLoading={loading}
        />
      </CounterBand>

      {loading ? (
        <RecordLoading label="Reading enrollment records" />
      ) : enrollments.length === 0 ? (
        <RecordEmpty label="No enrollments on record">
          No student has been assigned to a class yet. Add the first enrollment to open the roster.
        </RecordEmpty>
      ) : (
        Object.entries(enrollmentsByClass).map(([className, classEnrollments]) => (
          <RecordGroup
            key={className}
            title={className}
            meta={`${classEnrollments.length} enrolled`}
          >
            <RecordTable
              sticky={false}
              columns={[
                { label: 'Student', width: 24 },
                { label: 'Email', width: 28 },
                { label: 'Status', width: 14 },
                { label: 'Enrolled', width: 20 },
                ...(canManage ? [{ label: null, width: 14 }] : []),
              ]}
            >
              {classEnrollments.map((enrollment: Enrollment, i) => (
                <RecordRow
                  key={enrollment.id}
                  index={i}
                  isPending={
                    deleteEnrollmentMutation.isPending &&
                    deleteEnrollmentMutation.variables === enrollment.id
                  }
                >
                  <Cell tone="primary">{getStudentName(enrollment.student_id)}</Cell>
                  <Cell tone="code" title={getStudentEmail(enrollment.student_id)}>
                    {getStudentEmail(enrollment.student_id)}
                  </Cell>
                  <Cell>
                    <Marker tone={STATUS_TONE[enrollment.status]}>
                      {enrollment.status}
                    </Marker>
                  </Cell>
                  <Cell tone="numeral">{formatDateTime(enrollment.enrolled_at)}</Cell>
                  {canManage && (
                    <RecordActions
                      onEdit={() => handleEdit(enrollment)}
                      onDelete={() => handleDelete(enrollment.id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      deleteLabel="Remove"
                    />
                  )}
                </RecordRow>
              ))}
            </RecordTable>
          </RecordGroup>
        ))
      )}
    </div>
  );
}
