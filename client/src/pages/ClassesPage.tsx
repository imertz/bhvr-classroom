import { Link } from 'react-router-dom';
import { useClasses, useDeleteClass } from '../hooks/queries';
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
import type { Class } from 'shared/dist';

export default function ClassesPage() {
  const { data: classes = [], isLoading: loading, error } = useClasses();
  const deleteClassMutation = useDeleteClass();
  const { canCreate, canEdit, canDelete, isAuthenticated } = usePermissions();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClassMutation.mutateAsync(id);
    }
  };

  const showActions = canEdit || canDelete;

  return (
    <div>
      <RecordHeader
        eyebrow="CLSS · Register"
        title="Classes"
        count={loading ? undefined : classes.length}
        countLabel="on record"
        action={
          canCreate && (
            <Button asChild>
              <Link to="/classes/new">Add class</Link>
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {loading ? (
        <RecordLoading label="Reading class records" />
      ) : classes.length === 0 ? (
        <RecordEmpty label="No classes on record">
          {canCreate ? (
            <>
              The register is empty.{' '}
              <RecordLink to="/classes/new">Add the first class</RecordLink>.
            </>
          ) : isAuthenticated ? (
            <>Contact an administrator to add classes.</>
          ) : (
            <>
              <RecordLink to="/login">Sign in</RecordLink> to manage classes.
            </>
          )}
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Name', width: 20 },
            { label: 'Subject', width: 16 },
            { label: 'Teacher ID', width: 32 },
            { label: 'Room', width: 12 },
            ...(showActions ? [{ label: null, width: 14 }] : []),
          ]}
        >
          {classes.map((classItem: Class, i) => (
            <RecordRow
              key={classItem.id}
              index={i}
              isPending={
                deleteClassMutation.isPending &&
                deleteClassMutation.variables === classItem.id
              }
            >
              <Cell tone="primary">{classItem.name}</Cell>
              <Cell>{classItem.subject}</Cell>
              <Cell tone="code" title={classItem.teacher_id}>
                {classItem.teacher_id}
              </Cell>
              <Cell tone="numeral">{classItem.room_number || '—'}</Cell>
              {showActions && (
                <RecordActions
                  editTo={`/classes/${classItem.id}/edit`}
                  onDelete={() => handleDelete(classItem.id)}
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
