import { Link } from 'react-router-dom';
import { useTeachers, useDeleteTeacher } from '../hooks/queries';
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
import type { Teacher } from 'shared/dist';

export default function TeachersPage() {
  const { data: teachers = [], isLoading: loading, error } = useTeachers();
  const deleteTeacherMutation = useDeleteTeacher();
  const { canViewAdmin, isAuthenticated } = usePermissions();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      await deleteTeacherMutation.mutateAsync(id);
    }
  };

  return (
    <div>
      <RecordHeader
        eyebrow="TCHR · Register"
        title="Teachers"
        count={loading ? undefined : teachers.length}
        countLabel="on record"
        action={
          canViewAdmin && (
            <Button asChild>
              <Link to="/teachers/new">Add teacher</Link>
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {loading ? (
        <RecordLoading label="Reading staff records" />
      ) : teachers.length === 0 ? (
        <RecordEmpty label="No teachers on record">
          {canViewAdmin ? (
            <>
              The register is empty.{' '}
              <RecordLink to="/teachers/new">Add the first teacher</RecordLink>.
            </>
          ) : isAuthenticated ? (
            <>Contact an administrator to add teachers.</>
          ) : (
            <>
              <RecordLink to="/login">Sign in</RecordLink> to manage teachers.
            </>
          )}
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Name', className: 'w-[26%]' },
            { label: 'Email', className: 'w-[34%]' },
            { label: 'Created', className: 'w-[18%]' },
            ...(canViewAdmin ? [{ label: null, className: 'w-[14%]' }] : []),
          ]}
        >
          {teachers.map((teacher: Teacher, i) => (
            <RecordRow
              key={teacher.id}
              index={i}
              isPending={
                deleteTeacherMutation.isPending &&
                deleteTeacherMutation.variables === teacher.id
              }
            >
              <Cell tone="primary">
                {teacher.first_name} {teacher.last_name}
              </Cell>
              <Cell tone="code" title={teacher.email}>
                {teacher.email}
              </Cell>
              <Cell tone="numeral">{formatDate(teacher.created_at)}</Cell>
              {canViewAdmin && (
                <RecordActions
                  editTo={`/teachers/${teacher.id}/edit`}
                  onDelete={() => handleDelete(teacher.id)}
                  canEdit={canViewAdmin}
                  canDelete={canViewAdmin}
                />
              )}
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </div>
  );
}
