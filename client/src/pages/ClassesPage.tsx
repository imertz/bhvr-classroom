import { Link } from 'react-router-dom';
import { useClasses, useDeleteClass, useTeachers } from '../hooks/queries';
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
  const { data: classes = [], isLoading: loadingClasses, error: classesError } = useClasses();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const deleteClassMutation = useDeleteClass();
  const { canCreate, canEdit, canDelete, isAuthenticated } = usePermissions();

  const loading = loadingClasses || loadingTeachers;
  const error = classesError || deleteClassMutation.error;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClassMutation.mutateAsync(id);
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : teacherId;
  };

  const getTeacherEmail = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.email || undefined;
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
            { label: 'Name', width: 22 },
            { label: 'Subject', width: 16 },
            { label: 'Instructor', width: 22 },
            { label: 'Room', width: 10 },
            { label: null, width: 8 },
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
              <Cell tone="primary">
                <Link
                  to={`/classes/${classItem.id}`}
                  className="transition-colors duration-100 hover:text-signal hover:underline"
                >
                  {classItem.name}
                </Link>
              </Cell>
              <Cell>{classItem.subject}</Cell>
              <Cell title={getTeacherEmail(classItem.teacher_id)}>
                {getTeacherName(classItem.teacher_id)}
              </Cell>
              <Cell tone="numeral">{classItem.room_number || '—'}</Cell>
              <td className="py-4 pr-6 align-middle">
                <Link
                  to={`/classes/${classItem.id}`}
                  className="micro transition-colors duration-100 hover:text-signal"
                >
                  Details →
                </Link>
              </td>
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

