import { useState } from 'react';
import {
  useAttendanceRecords,
  useStudents,
  useClasses,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance
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
  RecordHeader,
  RecordLoading,
  RecordPanel,
  RecordRow,
  RecordTable,
} from '../components/ui/record';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate, getLocalDateString } from '../lib/utils';
import type { Attendance, AttendanceInput } from 'shared/dist';

const STATUS_TONE = {
  present: 'ink',
  absent: 'alert',
  tardy: 'signal',
  excused: 'mute',
} satisfies Record<string, 'mute' | 'signal' | 'alert' | 'ink'>;

export default function AttendancePage() {
  const { data: attendances = [], isLoading: loadingAttendances, error: attendancesError } = useAttendanceRecords();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();

  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const loading = loadingAttendances || loadingStudents || loadingClasses;
  const error = attendancesError || createAttendanceMutation.error || updateAttendanceMutation.error || deleteAttendanceMutation.error;

  const { isAdmin, isTeacher, isStudent } = usePermissions();
  const canManageAttendance = isAdmin || isTeacher;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AttendanceInput>({
    student_id: '',
    class_id: '',
    date: getLocalDateString(),
    status: 'present',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };

    if (editingId) {
      await updateAttendanceMutation.mutateAsync({ id: editingId, data: dataToSubmit });
      setEditingId(null);
    } else {
      await createAttendanceMutation.mutateAsync(dataToSubmit);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingId(attendance.id);
    setFormData({
      student_id: attendance.student_id,
      class_id: attendance.class_id,
      date: attendance.date.split('T')[0] || getLocalDateString(),
      status: attendance.status,
      notes: attendance.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      date: getLocalDateString(),
      status: 'present',
      notes: '',
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      await deleteAttendanceMutation.mutateAsync(id);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getClassName = (classId: string) => {
    const class_ = classes.find(c => c.id === classId);
    return class_ ? class_.name : 'Unknown Class';
  };

  const validDays = attendances.filter(a => a.status !== 'excused').length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const tardyCount = attendances.filter(a => a.status === 'tardy' || a.status === 'excused').length;
  const attendanceRate = validDays > 0 ? Math.round((presentCount / validDays) * 100) : 100;

  // The rate is the one figure that carries a judgement, so it carries a tone.
  const rateTone = attendanceRate >= 90 ? 'ink' : attendanceRate >= 75 ? 'signal' : 'alert';

  return (
    <div>
      <RecordHeader
        eyebrow="ATTN · Register"
        title={isStudent ? 'My Attendance' : 'Attendance'}
        subtitle={
          isStudent
            ? 'Your recorded classroom attendance history.'
            : 'The daily register of student presence.'
        }
        count={loading ? undefined : attendances.length}
        countLabel="entries"
        action={
          canManageAttendance && (
            <Button onClick={() => (showForm ? closeForm() : setShowForm(true))} variant={showForm ? 'outline' : 'default'}>
              {showForm ? 'Close' : 'Record attendance'}
            </Button>
          )
        }
      />

      {error && <RecordError error={error} />}

      {attendances.length > 0 && (
        <CounterBand cols={4}>
          <Counter
            label="Attendance rate"
            text={`${attendanceRate}%`}
            tone={rateTone}
            isLoading={loading}
            className="border-b border-rule sm:border-b-0 sm:border-r"
          />
          <Counter
            label="Present"
            value={presentCount}
            isLoading={loading}
            className="border-b border-rule sm:border-b-0 sm:border-r"
          />
          <Counter
            label="Absent"
            value={absentCount}
            tone={absentCount > 0 ? 'alert' : 'ink'}
            isLoading={loading}
            className="border-r border-rule"
          />
          <Counter label="Tardy / excused" value={tardyCount} isLoading={loading} />
        </CounterBand>
      )}

      {showForm && (
        <RecordPanel
          eyebrow={editingId ? 'Amend entry' : 'New entry'}
          title={editingId ? 'Edit attendance' : 'Record attendance'}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              <Field index={1} label="Student" htmlFor="attendance-student">
                <select
                  id="attendance-student"
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
              </Field>

              <Field index={2} label="Class" htmlFor="attendance-class">
                <select
                  id="attendance-class"
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

              <Field index={3} label="Date" htmlFor="attendance-date">
                <input
                  id="attendance-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="field"
                />
              </Field>

              <Field index={4} label="Status" htmlFor="attendance-status">
                <select
                  id="attendance-status"
                  value={formData.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === 'present' || status === 'absent' || status === 'tardy' || status === 'excused') {
                      setFormData({ ...formData, status });
                    }
                  }}
                  className="field field-select"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="tardy">Tardy</option>
                  <option value="excused">Excused</option>
                </select>
              </Field>

              <Field index={5} label="Notes" htmlFor="attendance-notes" className="md:col-span-2">
                <textarea
                  id="attendance-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="field field-box"
                />
              </Field>
            </div>

            <div className="mt-8 flex gap-3 border-t border-rule pt-6">
              <Button
                type="submit"
                disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
              >
                {editingId ? 'Update entry' : 'Record entry'}
              </Button>
              <Button type="button" onClick={closeForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </RecordPanel>
      )}

      {loading ? (
        <RecordLoading label="Reading the attendance register" />
      ) : attendances.length === 0 ? (
        <RecordEmpty label="Register empty">
          {isStudent
            ? 'No attendance has been recorded against your account yet.'
            : 'No attendance has been taken yet. The first entry opens the register.'}
        </RecordEmpty>
      ) : (
        <RecordTable
          columns={[
            { label: 'Student', width: 22 },
            { label: 'Class', width: 18 },
            { label: 'Date', width: 14 },
            { label: 'Status', width: 14 },
            { label: 'Notes', width: 20 },
            ...(canManageAttendance ? [{ label: null, width: 12 }] : []),
          ]}
        >
          {attendances.map((attendance: Attendance, i) => (
            <RecordRow
              key={attendance.id}
              index={i}
              isPending={
                deleteAttendanceMutation.isPending &&
                deleteAttendanceMutation.variables === attendance.id
              }
            >
              <Cell tone="primary">{getStudentName(attendance.student_id)}</Cell>
              <Cell>{getClassName(attendance.class_id)}</Cell>
              <Cell tone="numeral">{formatDate(attendance.date)}</Cell>
              <Cell>
                <Marker tone={STATUS_TONE[attendance.status]}>
                  {attendance.status}
                </Marker>
              </Cell>
              <Cell title={attendance.notes || undefined}>{attendance.notes || '—'}</Cell>
              {canManageAttendance && (
                <RecordActions
                  onEdit={() => handleEdit(attendance)}
                  onDelete={() => handleDelete(attendance.id)}
                />
              )}
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </div>
  );
}
