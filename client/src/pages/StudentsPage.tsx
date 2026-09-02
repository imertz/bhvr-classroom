import { Link } from 'react-router-dom';
import { useStudents, useDeleteStudent } from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Cell,
  RecordActions,
  RecordEmpty,
  RecordError,
  RecordHeader,
  RecordLink,
  RecordLoading,
  RecordRow,
  RecordTable,
} from '../components/ui/record';
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

  const showActions = canEdit || canDelete;

  return (
    <div>
      <RecordHeader
        eyebrow="STDN · Register"
        title="Students"
        count={loading ? undefined : students.length}
        countLabel="on record"
        action={
          canCreate && (
            <Button asChild>
              <Link to="/students/new">Add student</Link>
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {loading ? (
        <RecordLoading label="Reading student records" />
      ) : students.length === 0 ? (
        <RecordEmpty label="No students on record">
          {canCreate ? (
            <>
              The register is empty.{' '}
              <RecordLink to="/students/new">Add the first student</RecordLink>.
            </>
          ) : isAuthenticated ? (
            <>Contact an administrator to add students.</>
          ) : (
            <>
              <RecordLink to="/login">Sign in</RecordLink> to manage students.
            </>
          )}
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Name', className: 'w-[22%]' },
            { label: 'Email', className: 'w-[30%]' },
            { label: 'Grade', className: 'w-[10%]' },
            { label: 'Date of birth', className: 'w-[16%]' },
            ...(showActions ? [{ label: null, className: 'w-[14%]' }] : []),
          ]}
        >
          {students.map((student: Student, i) => (
            <RecordRow
              key={student.id}
              index={i}
              isPending={
                deleteStudentMutation.isPending &&
                deleteStudentMutation.variables === student.id
              }
            >
              <Cell tone="primary">
                {student.first_name} {student.last_name}
              </Cell>
              <Cell tone="code" title={student.email}>
                {student.email}
              </Cell>
              <Cell tone="numeral">{student.grade_level}</Cell>
              <Cell tone="numeral">{formatDate(student.date_of_birth)}</Cell>
              {showActions && (
                <RecordActions
                  editTo={`/students/${student.id}/edit`}
                  onDelete={() => handleDelete(student.id)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              )}
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </div>
  );
}
