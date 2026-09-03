import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useClassDetails,
  useDeleteClass,
  useStudents,
  useCreateEnrollment,
  useUpdateEnrollment,
  useDeleteEnrollment,
  useCreateAssignment,
  useDeleteAssignment,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useCreateAttendance,
  useDeleteAttendance,
} from '../hooks/queries';
import { Button } from '../components/ui/button';
import {
  Cell,
  Counter,
  CounterBand,
  Field,
  Marker,
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
import { useAuthStore } from '../stores/authStore';
import { formatDate, formatDateTime, getLocalDateString } from '../lib/utils';
import type {
  EnrollmentInput,
  AssignmentInput,
  AnnouncementInput,
  AttendanceInput,
  ClassEnrollmentDetail,
  Assignment,
  Announcement,
  ClassAttendanceDetail,
} from 'shared/dist';

const ENROLLMENT_STATUS_TONE = {
  active: 'signal',
  completed: 'ink',
  dropped: 'alert',
} satisfies Record<string, 'mute' | 'signal' | 'alert' | 'ink'>;

const ASSIGNMENT_TYPE_TONE = {
  homework: 'mute',
  quiz: 'signal',
  test: 'ink',
  project: 'signal',
} satisfies Record<string, 'mute' | 'signal' | 'ink'>;

const ATTENDANCE_STATUS_TONE = {
  present: 'signal',
  absent: 'alert',
  tardy: 'mute',
  excused: 'mute',
} satisfies Record<string, 'mute' | 'signal' | 'alert' | 'ink'>;

type QuickActionPanel = 'none' | 'enroll' | 'assignment' | 'announcement' | 'attendance';

export default function ClassDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { canCreate, canEdit, canDelete, isAuthenticated } = usePermissions();

  const { data: details, isLoading: loadingDetails, error: detailsError, refetch } = useClassDetails(id);
  const { data: allStudents = [] } = useStudents();

  const deleteClassMutation = useDeleteClass();
  const createEnrollmentMutation = useCreateEnrollment();
  const updateEnrollmentMutation = useUpdateEnrollment();
  const deleteEnrollmentMutation = useDeleteEnrollment();
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const createAnnouncementMutation = useCreateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();
  const createAttendanceMutation = useCreateAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const [activePanel, setActivePanel] = useState<QuickActionPanel>('none');

  // Input focus refs
  const enrollSelectRef = useRef<HTMLSelectElement | null>(null);
  const assignmentInputRef = useRef<HTMLInputElement | null>(null);
  const announcementInputRef = useRef<HTMLInputElement | null>(null);
  const attendanceSelectRef = useRef<HTMLSelectElement | null>(null);

  // Form states for quick actions
  const [enrollForm, setEnrollForm] = useState<EnrollmentInput>({
    student_id: '',
    class_id: id || '',
    status: 'active',
  });

  const [assignmentForm, setAssignmentForm] = useState<AssignmentInput>({
    class_id: id || '',
    title: '',
    description: '',
    type: 'homework',
    points_possible: 100,
    due_date: '',
  });

  const [announcementForm, setAnnouncementForm] = useState<AnnouncementInput>({
    class_id: id || '',
    teacher_id: details?.class.teacher_id || user?.id || '',
    title: '',
    content: '',
    expires_at: null,
  });

  const [attendanceForm, setAttendanceForm] = useState<AttendanceInput>({
    student_id: '',
    class_id: id || '',
    date: getLocalDateString(),
    status: 'present',
    notes: null,
  });

  const [panelError, setPanelError] = useState<string | null>(null);

  const loading = loadingDetails;
  const error = detailsError;

  const openPanel = (panel: QuickActionPanel, elementId?: string) => {
    setPanelError(null);
    setActivePanel((prev) => {
      const next = prev === panel ? 'none' : panel;
      if (next !== 'none' && elementId) {
        setTimeout(() => {
          const el = document.getElementById(elementId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
      }
      return next;
    });
  };

  useEffect(() => {
    if (activePanel === 'enroll') {
      enrollSelectRef.current?.focus();
    } else if (activePanel === 'assignment') {
      assignmentInputRef.current?.focus();
    } else if (activePanel === 'announcement') {
      announcementInputRef.current?.focus();
    } else if (activePanel === 'attendance') {
      attendanceSelectRef.current?.focus();
    }
  }, [activePanel]);

  const handleDeleteClass = async () => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this class? This will remove all associated records.')) {
      await deleteClassMutation.mutateAsync(id);
      navigate('/classes');
    }
  };

  // Quick action submit handlers
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !enrollForm.student_id) return;
    try {
      await createEnrollmentMutation.mutateAsync({
        ...enrollForm,
        class_id: id,
      });
      setEnrollForm({ student_id: '', class_id: id, status: 'active' });
      setPanelError(null);
      setActivePanel('none');
      await refetch();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Failed to enroll student');
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignmentForm.title || !assignmentForm.due_date) return;
    try {
      await createAssignmentMutation.mutateAsync({
        ...assignmentForm,
        class_id: id,
      });
      setAssignmentForm({
        class_id: id,
        title: '',
        description: '',
        type: 'homework',
        points_possible: 100,
        due_date: '',
      });
      setPanelError(null);
      setActivePanel('none');
      await refetch();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Failed to create assignment');
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !details || !announcementForm.title || !announcementForm.content) return;
    try {
      await createAnnouncementMutation.mutateAsync({
        ...announcementForm,
        class_id: id,
        teacher_id: details.class.teacher_id || user?.id || '',
      });
      setAnnouncementForm({
        class_id: id,
        teacher_id: details.class.teacher_id || user?.id || '',
        title: '',
        content: '',
        expires_at: null,
      });
      setPanelError(null);
      setActivePanel('none');
      await refetch();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Failed to post announcement');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !attendanceForm.student_id || !attendanceForm.date) return;
    try {
      await createAttendanceMutation.mutateAsync({
        ...attendanceForm,
        class_id: id,
      });
      setAttendanceForm({
        student_id: '',
        class_id: id,
        date: getLocalDateString(),
        status: 'present',
        notes: null,
      });
      setPanelError(null);
      setActivePanel('none');
      await refetch();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Failed to record attendance');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (confirm('Are you sure you want to remove this student from the class?')) {
      await deleteEnrollmentMutation.mutateAsync(enrollmentId);
      await refetch();
    }
  };

  const handleToggleEnrollmentStatus = async (enrollment: ClassEnrollmentDetail) => {
    const nextStatus = enrollment.status === 'active' ? 'completed' : 'active';
    await updateEnrollmentMutation.mutateAsync({
      id: enrollment.id,
      data: { status: nextStatus },
    });
    await refetch();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignmentMutation.mutateAsync(assignmentId);
      await refetch();
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncementMutation.mutateAsync(announcementId);
      await refetch();
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (confirm('Are you sure you want to delete this attendance entry?')) {
      await deleteAttendanceMutation.mutateAsync(attendanceId);
      await refetch();
    }
  };

  if (loading) {
    return (
      <div>
        <div className="border-b border-rule px-6 py-4 sm:px-8 lg:px-12">
          <Link to="/classes" className="micro transition-colors hover:text-signal">
            ← Back to classes
          </Link>
        </div>
        <RecordLoading label="Reading complete class record" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div>
        <div className="border-b border-rule px-6 py-4 sm:px-8 lg:px-12">
          <Link to="/classes" className="micro transition-colors hover:text-signal">
            ← Back to classes
          </Link>
        </div>
        <RecordError error={error || new Error('Class record not found')} />
      </div>
    );
  }

  const {
    class: classItem,
    teacher,
    enrollments,
    assignments,
    announcements,
    recentAttendance,
    stats,
  } = details;

  // Students not yet enrolled in this class (for the quick enroll picker)
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student_id));
  const availableStudentsToEnroll = allStudents.filter((s) => !enrolledStudentIds.has(s.id));

  return (
    <div>
      {/* ================= BREADCRUMB & MASTHEAD ================= */}
      <div className="flex items-center justify-between border-b border-rule px-6 py-3.5 sm:px-8 lg:px-12">
        <Link to="/classes" className="micro transition-colors hover:text-signal">
          ← Back to classes register
        </Link>
        <span className="index-numeral text-[0.6875rem] text-muted-foreground">
          ID: {classItem.id.slice(0, 8)}…
        </span>
      </div>

      <RecordHeader
        eyebrow="CLSS · Complete Record"
        title={classItem.name}
        subtitle={`${classItem.subject}${classItem.room_number ? ` · Room ${classItem.room_number}` : ''}${classItem.schedule ? ` · ${classItem.schedule}` : ''}`}
        count={stats.activeEnrollments}
        countLabel="enrolled students"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <Button asChild variant="outline">
                <Link to={`/classes/${classItem.id}/edit`}>Edit class</Link>
              </Button>
            )}
            {canDelete && (
              <Button onClick={handleDeleteClass} variant="outline">
                Delete class
              </Button>
            )}
            {canCreate && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => openPanel('enroll', 'section-roster')}
                  variant={activePanel === 'enroll' ? 'default' : 'outline'}
                  size="sm"
                >
                  {activePanel === 'enroll' ? 'Close Enroll' : '+ Enroll student'}
                </Button>
                <Button
                  onClick={() => openPanel('assignment', 'section-assignments')}
                  variant={activePanel === 'assignment' ? 'default' : 'outline'}
                  size="sm"
                >
                  {activePanel === 'assignment' ? 'Close Assignment' : '+ Add assignment'}
                </Button>
                <Button
                  onClick={() => openPanel('announcement', 'section-announcements')}
                  variant={activePanel === 'announcement' ? 'default' : 'outline'}
                  size="sm"
                >
                  {activePanel === 'announcement' ? 'Close Notice' : '+ Announcement'}
                </Button>
                <Button
                  onClick={() => openPanel('attendance', 'section-attendance')}
                  variant={activePanel === 'attendance' ? 'default' : 'outline'}
                  size="sm"
                >
                  {activePanel === 'attendance' ? 'Close Attendance' : '+ Attendance'}
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* ================= COUNTERS BAND ================= */}
      <CounterBand cols={4}>
        <Counter
          label="Active roster"
          value={stats.activeEnrollments}
          note={`${stats.totalEnrollments} total on register`}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Assignments set"
          value={stats.totalAssignments}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Announcements"
          value={stats.totalAnnouncements}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Attendance rate"
          text={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '––'}
          tone={stats.attendanceRate !== null && stats.attendanceRate >= 85 ? 'signal' : 'ink'}
          note={stats.attendanceRate !== null ? `${recentAttendance.length} logs recorded` : 'No attendance logs'}
        />
      </CounterBand>

      {/* ================= INSTRUCTOR & SCHEDULE SPECIFICATION ================= */}
      <section className="grid border-b border-rule md:grid-cols-2">
        <div className="border-b border-rule p-6 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-8">
          <span className="micro micro-signal">Course Instructor</span>
          <div className="mt-4 flex flex-col gap-1">
            <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em]">
              {teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unassigned Instructor'}
            </h3>
            {teacher?.email && (
              <a
                href={`mailto:${teacher.email}`}
                className="font-mono text-[0.8125rem] text-muted-foreground hover:text-signal hover:underline"
              >
                {teacher.email}
              </a>
            )}
            {teacher?.role && (
              <span className="mt-2">
                <Marker tone="mute">{teacher.role}</Marker>
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:px-8 lg:px-12 lg:py-8">
          <span className="micro">Meeting Specifications</span>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="micro text-muted-foreground">Assigned Room</span>
              <p className="mt-1 text-[0.9375rem] font-medium text-foreground">
                {classItem.room_number || 'Room not assigned'}
              </p>
            </div>
            <div>
              <span className="micro text-muted-foreground">Schedule</span>
              <p className="mt-1 text-[0.9375rem] font-medium text-foreground">
                {classItem.schedule || 'Flexible / To be announced'}
              </p>
            </div>
            <div>
              <span className="micro text-muted-foreground">Established</span>
              <p className="index-numeral mt-1 text-[0.8125rem] text-muted-foreground">
                {formatDate(classItem.created_at)}
              </p>
            </div>
            <div>
              <span className="micro text-muted-foreground">Last Updated</span>
              <p className="index-numeral mt-1 text-[0.8125rem] text-muted-foreground">
                {formatDate(classItem.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 1: STUDENT ROSTER ================= */}
      <div id="section-roster">
        <RecordGroup
          title="Student Roster"
          meta={`${enrollments.length} enrolled (${stats.activeEnrollments} active)`}
        >
          {activePanel === 'enroll' && (
            <div id="enroll-panel">
              <RecordPanel eyebrow="Roster Management" title="Enroll Student to Class">
                <form onSubmit={handleEnrollSubmit}>
                  {panelError && <p className="mb-4 text-sm text-destructive font-medium">{panelError}</p>}
                  <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                    <Field index={1} label="Student" htmlFor="quick-student">
                      <select
                        ref={enrollSelectRef}
                        id="quick-student"
                        value={enrollForm.student_id}
                        onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                        required
                        className="field field-select"
                      >
                        <option value="">Select a student</option>
                        {availableStudentsToEnroll.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.first_name} {s.last_name} ({s.email}) · Grade {s.grade_level}
                          </option>
                        ))}
                        {availableStudentsToEnroll.length === 0 && (
                          <option disabled value="">All registered students are already enrolled</option>
                        )}
                      </select>
                    </Field>

                    <Field index={2} label="Enrollment status" htmlFor="quick-enroll-status">
                      <select
                        id="quick-enroll-status"
                        value={enrollForm.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          if (status === 'active' || status === 'dropped' || status === 'completed') {
                            setEnrollForm({ ...enrollForm, status });
                          }
                        }}
                        className="field field-select"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </Field>
                  </div>

                  <div className="mt-8 flex gap-3 border-t border-rule pt-6">
                    <Button type="submit" disabled={createEnrollmentMutation.isPending || !enrollForm.student_id}>
                      {createEnrollmentMutation.isPending ? 'Enrolling…' : 'Enroll in class'}
                    </Button>
                    <Button type="button" onClick={() => setActivePanel('none')} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </RecordPanel>
            </div>
          )}

          {enrollments.length === 0 && activePanel !== 'enroll' ? (
            <RecordEmpty label="No students enrolled">
              {canCreate ? (
                <>
                  The class roster is currently empty.{' '}
                  <button
                    type="button"
                    onClick={() => openPanel('enroll', 'section-roster')}
                    className="text-signal underline hover:text-foreground"
                  >
                    Enroll the first student
                  </button>
                  .
                </>
              ) : isAuthenticated ? (
                'No students are currently enrolled in this course.'
              ) : (
                <>
                  The class roster is currently empty.{' '}
                  <Link to="/login" className="text-signal underline hover:text-foreground">
                    Sign in
                  </Link>{' '}
                  to enroll students.
                </>
              )}
            </RecordEmpty>
          ) : enrollments.length > 0 ? (
            <RecordTable
              sticky={false}
              columns={[
                { label: 'Student', width: 24 },
                { label: 'Email', width: 28 },
                { label: 'Grade', width: 10 },
                { label: 'Status', width: 14 },
                { label: 'Enrolled On', width: 16 },
                ...(canEdit || canDelete ? [{ label: null, width: 14 }] : []),
              ]}
            >
              {enrollments.map((e: ClassEnrollmentDetail, i) => (
                <RecordRow
                  key={e.id}
                  index={i}
                  isPending={
                    deleteEnrollmentMutation.isPending &&
                    deleteEnrollmentMutation.variables === e.id
                  }
                >
                  <Cell tone="primary">
                    {e.student.first_name} {e.student.last_name}
                  </Cell>
                  <Cell tone="code" title={e.student.email}>
                    {e.student.email}
                  </Cell>
                  <Cell tone="numeral">Grade {e.student.grade_level}</Cell>
                  <Cell>
                    <Marker tone={ENROLLMENT_STATUS_TONE[e.status]}>{e.status}</Marker>
                  </Cell>
                  <Cell tone="numeral">{formatDate(e.enrolled_at)}</Cell>
                  {(canEdit || canDelete) && (
                    <td className="py-4 pr-6 text-right align-middle sm:pr-8 lg:pr-12">
                      <span className="inline-flex items-center gap-4">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleToggleEnrollmentStatus(e)}
                            className="micro transition-colors hover:text-signal"
                          >
                            {e.status === 'active' ? 'Mark Done' : 'Reactivate'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEnrollment(e.id)}
                            className="micro transition-colors hover:text-destructive"
                          >
                            Remove
                          </button>
                        )}
                      </span>
                    </td>
                  )}
                </RecordRow>
              ))}
            </RecordTable>
          ) : null}
        </RecordGroup>
      </div>

      {/* ================= SECTION 2: ASSIGNMENTS & DEADLINES ================= */}
      <div id="section-assignments">
        <RecordGroup
          title="Assignments & Coursework"
          meta={`${assignments.length} assigned`}
        >
          {activePanel === 'assignment' && (
            <div id="assignment-panel">
              <RecordPanel eyebrow="Coursework" title="Add Class Assignment">
                <form onSubmit={handleAssignmentSubmit}>
                  {panelError && <p className="mb-4 text-sm text-destructive font-medium">{panelError}</p>}
                  <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                    <Field index={1} label="Assignment title" htmlFor="quick-assignment-title">
                      <input
                        ref={assignmentInputRef}
                        id="quick-assignment-title"
                        type="text"
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                        required
                        placeholder="Problem Set 3"
                        className="field"
                      />
                    </Field>

                    <Field index={2} label="Assignment type" htmlFor="quick-assignment-type">
                      <select
                        id="quick-assignment-type"
                        value={assignmentForm.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          if (type === 'homework' || type === 'quiz' || type === 'test' || type === 'project') {
                            setAssignmentForm({ ...assignmentForm, type });
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

                    <Field index={3} label="Points possible" htmlFor="quick-assignment-points">
                      <input
                        id="quick-assignment-points"
                        type="number"
                        min="1"
                        value={assignmentForm.points_possible}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, points_possible: parseInt(e.target.value) || 100 })}
                        required
                        className="field"
                      />
                    </Field>

                    <Field index={4} label="Due date and time" htmlFor="quick-assignment-due">
                      <input
                        id="quick-assignment-due"
                        type="datetime-local"
                        value={assignmentForm.due_date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                        required
                        className="field"
                      />
                    </Field>

                    <Field index={5} label="Description & instructions" htmlFor="quick-assignment-desc" className="md:col-span-2">
                      <textarea
                        id="quick-assignment-desc"
                        value={assignmentForm.description || ''}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                        rows={3}
                        placeholder="Enter details, syllabus readings, or submission requirements"
                        className="field field-box"
                      />
                    </Field>
                  </div>

                  <div className="mt-8 flex gap-3 border-t border-rule pt-6">
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? 'Publishing…' : 'Publish assignment'}
                    </Button>
                    <Button type="button" onClick={() => setActivePanel('none')} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </RecordPanel>
            </div>
          )}

          {assignments.length === 0 && activePanel !== 'assignment' ? (
            <RecordEmpty label="No assignments set">
              {canCreate ? (
                <>
                  No assignments have been published yet.{' '}
                  <button
                    type="button"
                    onClick={() => openPanel('assignment', 'section-assignments')}
                    className="text-signal underline hover:text-foreground"
                  >
                    Create an assignment
                  </button>
                  .
                </>
              ) : (
                'No assignments are currently posted for this class.'
              )}
            </RecordEmpty>
          ) : assignments.length > 0 ? (
            <RecordTable
              sticky={false}
              columns={[
                { label: 'Title', width: 26 },
                { label: 'Type', width: 12 },
                { label: 'Points', width: 10 },
                { label: 'Due Date', width: 22 },
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
                  <Cell>
                    <Marker tone={ASSIGNMENT_TYPE_TONE[assignment.type]}>
                      {assignment.type}
                    </Marker>
                  </Cell>
                  <Cell tone="numeral">{assignment.points_possible} pts</Cell>
                  <Cell tone="numeral">{formatDateTime(assignment.due_date)}</Cell>
                  {canDelete && (
                    <td className="py-4 pr-6 text-right align-middle sm:pr-8 lg:pr-12">
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="micro transition-colors hover:text-destructive"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </RecordRow>
              ))}
            </RecordTable>
          ) : null}
        </RecordGroup>
      </div>

      {/* ================= SECTION 3: CLASS ANNOUNCEMENTS ================= */}
      <div id="section-announcements">
        <RecordGroup
          title="Class Announcements"
          meta={`${announcements.length} posted`}
        >
          {activePanel === 'announcement' && (
            <div id="announcement-panel">
              <RecordPanel eyebrow="Communication" title="Broadcast Class Announcement">
                <form onSubmit={handleAnnouncementSubmit}>
                  {panelError && <p className="mb-4 text-sm text-destructive font-medium">{panelError}</p>}
                  <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                    <Field index={1} label="Announcement title" htmlFor="quick-annc-title" className="md:col-span-2">
                      <input
                        ref={announcementInputRef}
                        id="quick-annc-title"
                        type="text"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        required
                        placeholder="Midterm review session scheduled"
                        className="field"
                      />
                    </Field>

                    <Field index={2} label="Announcement content" htmlFor="quick-annc-content" className="md:col-span-2">
                      <textarea
                        id="quick-annc-content"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                        required
                        rows={4}
                        placeholder="Write the message for enrolled students…"
                        className="field field-box"
                      />
                    </Field>

                    <Field index={3} label="Expiry date" htmlFor="quick-annc-expiry" optional hint="Optional date after which notice expires">
                      <input
                        id="quick-annc-expiry"
                        type="datetime-local"
                        value={announcementForm.expires_at || ''}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value || null })}
                        className="field"
                      />
                    </Field>
                  </div>

                  <div className="mt-8 flex gap-3 border-t border-rule pt-6">
                    <Button type="submit" disabled={createAnnouncementMutation.isPending}>
                      {createAnnouncementMutation.isPending ? 'Posting…' : 'Post announcement'}
                    </Button>
                    <Button type="button" onClick={() => setActivePanel('none')} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </RecordPanel>
            </div>
          )}

          {announcements.length === 0 && activePanel !== 'announcement' ? (
            <RecordEmpty label="No announcements posted">
              {canCreate ? (
                <>
                  No notices on the class board.{' '}
                  <button
                    type="button"
                    onClick={() => openPanel('announcement', 'section-announcements')}
                    className="text-signal underline hover:text-foreground"
                  >
                    Broadcast an announcement
                  </button>
                  .
                </>
              ) : (
                'There are no active notices for this class.'
              )}
            </RecordEmpty>
          ) : announcements.length > 0 ? (
            <div className="divide-y divide-rule">
              {announcements.map((annc: Announcement, i) => (
                <div
                  key={annc.id}
                  className="group flex flex-col gap-3 px-6 py-6 transition-colors hover:bg-signal-tint sm:px-8 lg:px-12"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="micro micro-signal">ANNC {i + 1}</span>
                      <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-foreground">
                        {annc.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="index-numeral text-[0.6875rem] text-muted-foreground">
                        Posted {formatDate(annc.created_at)}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(annc.id)}
                          className="micro transition-colors hover:text-destructive"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="max-w-3xl text-[0.875rem] leading-relaxed text-foreground/85 whitespace-pre-line">
                    {annc.content}
                  </p>
                  {annc.expires_at && (
                    <span className="micro text-muted-foreground">
                      Expires on {formatDate(annc.expires_at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </RecordGroup>
      </div>

      {/* ================= SECTION 4: ATTENDANCE LOG ================= */}
      <div id="section-attendance">
        <RecordGroup
          title="Recent Attendance Log"
          meta={`${recentAttendance.length} records`}
        >
          {activePanel === 'attendance' && (
            <div id="attendance-panel">
              <RecordPanel eyebrow="Daily Register" title="Record Attendance Entry">
                <form onSubmit={handleAttendanceSubmit}>
                  {panelError && <p className="mb-4 text-sm text-destructive font-medium">{panelError}</p>}
                  <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                    <Field index={1} label="Student" htmlFor="quick-attn-student">
                      <select
                        ref={attendanceSelectRef}
                        id="quick-attn-student"
                        value={attendanceForm.student_id}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, student_id: e.target.value })}
                        required
                        className="field field-select"
                      >
                        <option value="">Select an enrolled student</option>
                        {enrollments.map((e) => (
                          <option key={e.student_id} value={e.student_id}>
                            {e.student.first_name} {e.student.last_name} ({e.student.email})
                          </option>
                        ))}
                        {enrollments.length === 0 && (
                          <option disabled value="">No students currently enrolled</option>
                        )}
                      </select>
                    </Field>

                    <Field index={2} label="Date" htmlFor="quick-attn-date">
                      <input
                        id="quick-attn-date"
                        type="date"
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                        required
                        className="field"
                      />
                    </Field>

                    <Field index={3} label="Status" htmlFor="quick-attn-status">
                      <select
                        id="quick-attn-status"
                        value={attendanceForm.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          if (status === 'present' || status === 'absent' || status === 'tardy' || status === 'excused') {
                            setAttendanceForm({ ...attendanceForm, status });
                          }
                        }}
                        className="field field-select"
                      >
                        <option value="present">Present</option>
                        <option value="tardy">Tardy</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </Field>

                    <Field index={4} label="Notes" htmlFor="quick-attn-notes" optional>
                      <input
                        id="quick-attn-notes"
                        type="text"
                        value={attendanceForm.notes || ''}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value || null })}
                        placeholder="e.g. Arrived 15m late with pass"
                        className="field"
                      />
                    </Field>
                  </div>

                  <div className="mt-8 flex gap-3 border-t border-rule pt-6">
                    <Button type="submit" disabled={createAttendanceMutation.isPending || !attendanceForm.student_id}>
                      {createAttendanceMutation.isPending ? 'Recording…' : 'Record attendance'}
                    </Button>
                    <Button type="button" onClick={() => setActivePanel('none')} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </RecordPanel>
            </div>
          )}

          {recentAttendance.length === 0 && activePanel !== 'attendance' ? (
            <RecordEmpty label="No attendance records">
              {canCreate ? (
                <>
                  Attendance has not yet been recorded for this class.{' '}
                  <button
                    type="button"
                    onClick={() => openPanel('attendance', 'section-attendance')}
                    className="text-signal underline hover:text-foreground"
                  >
                    Record attendance
                  </button>
                  .
                </>
              ) : (
                'No attendance entries found for this class.'
              )}
            </RecordEmpty>
          ) : recentAttendance.length > 0 ? (
            <RecordTable
              sticky={false}
              columns={[
                { label: 'Student', width: 26 },
                { label: 'Date', width: 18 },
                { label: 'Status', width: 14 },
                { label: 'Notes', width: 30 },
                ...(canDelete ? [{ label: null, width: 12 }] : []),
              ]}
            >
              {recentAttendance.map((attn: ClassAttendanceDetail, i) => (
                <RecordRow
                  key={attn.id}
                  index={i}
                  isPending={
                    deleteAttendanceMutation.isPending &&
                    deleteAttendanceMutation.variables === attn.id
                  }
                >
                  <Cell tone="primary">{attn.student_name}</Cell>
                  <Cell tone="numeral">{formatDate(attn.date)}</Cell>
                  <Cell>
                    <Marker tone={ATTENDANCE_STATUS_TONE[attn.status]}>
                      {attn.status}
                    </Marker>
                  </Cell>
                  <Cell>{attn.notes || '—'}</Cell>
                  {canDelete && (
                    <td className="py-4 pr-6 text-right align-middle sm:pr-8 lg:pr-12">
                      <button
                        type="button"
                        onClick={() => handleDeleteAttendance(attn.id)}
                        className="micro transition-colors hover:text-destructive"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </RecordRow>
              ))}
            </RecordTable>
          ) : null}
        </RecordGroup>
      </div>
    </div>
  );
}
