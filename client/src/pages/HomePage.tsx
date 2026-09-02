import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useClasses, useAssignments, useAnnouncements } from '../hooks/queries';
import { Counter, CounterBand } from '../components/ui/record';
import { ordinal } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type Access = 'OPEN' | 'STAFF' | 'ADMIN';

interface ModuleEntry {
  path: string;
  code: string;
  title: string;
  description: string;
  access: Access;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { isAuthenticated, isAdmin, isTeacher, isStudent } = usePermissions();

  const classes = useClasses();
  const assignments = useAssignments();
  const announcements = useAnnouncements();

  const name = user?.firstName || user?.email.split('@')[0] || '';

  const eyebrow = !isAuthenticated
    ? 'Public access · read only'
    : isAdmin
      ? 'Administrator'
      : isTeacher
        ? 'Teaching staff'
        : 'Student';

  const headline = isAuthenticated && name ? name : 'Classroom.';

  const subtitle = isStudent
    ? 'Your classes, assignments, grades and attendance — the complete record, kept in one place.'
    : isTeacher
      ? 'Manage your courses, grade submitted work, and keep the daily attendance record.'
      : isAdmin
        ? 'Full school administration: staff, rosters, enrolment and the academic record.'
        : 'A school management system for teachers, students and administrators. Sign in for the full record.';

  const modules: ModuleEntry[] = ([
    {
      path: '/teachers',
      code: 'TCHR',
      title: 'Teachers',
      description: 'Staff accounts, roles and profiles',
      access: 'ADMIN',
    },
    {
      path: '/students',
      code: 'STDN',
      title: 'Students',
      description: 'Student records, credentials and profiles',
      access: 'STAFF',
    },
    {
      path: '/classes',
      code: 'CLSS',
      title: isStudent ? 'My Classes' : 'Classes',
      description: isStudent
        ? 'Enrolled classes, schedules and room details'
        : 'Class schedules, subjects and assigned rooms',
      access: 'OPEN',
    },
    {
      path: '/assignments',
      code: 'ASGN',
      title: isStudent ? 'My Assignments' : 'Assignments',
      description: isStudent
        ? 'Assigned homework, projects and due dates'
        : 'Set homework, projects and deadlines',
      access: 'OPEN',
    },
    {
      path: '/announcements',
      code: 'ANNC',
      title: 'Announcements',
      description: isStudent
        ? 'Class updates and reminders'
        : 'Publish updates to enrolled students',
      access: 'OPEN',
    },
    {
      path: '/submissions',
      code: 'SUBM',
      title: isStudent ? 'My Submissions' : 'Submissions',
      description: isStudent
        ? 'Hand in work and check submission status'
        : 'Review and track submitted student work',
      access: 'OPEN',
    },
    {
      path: '/enrollments',
      code: 'ENRL',
      title: 'Enrollments',
      description: 'Assign students to classes and manage rosters',
      access: 'STAFF',
    },
    {
      path: '/attendance',
      code: 'ATTN',
      title: isStudent ? 'My Attendance' : 'Attendance',
      description: isStudent
        ? 'Attendance history and recorded absences'
        : 'Record and track daily student presence',
      access: 'OPEN',
    },
    {
      path: '/grades',
      code: 'GRDS',
      title: isStudent ? 'My Grades' : 'Grades',
      description: isStudent
        ? 'Scores, points awarded and teacher feedback'
        : 'Enter grades and return feedback',
      access: 'OPEN',
    },
  ] satisfies ModuleEntry[]).filter((entry) => {
    if (entry.access === 'ADMIN') return isAdmin;
    if (entry.access === 'STAFF') return isAdmin || isTeacher;
    return true;
  });

  const procedures = isStudent
    ? [
        {
          key: 'A',
          heading: 'Assignments & work',
          steps: [
            'Check My Assignments for upcoming homework and due dates',
            'Open Submissions to hand in or enter your work',
            'Review My Grades for scores and teacher feedback',
          ],
        },
        {
          key: 'B',
          heading: 'Staying current',
          steps: [
            'Read Announcements for class updates and reminders',
            'Check My Attendance to confirm the record is accurate',
            'Open My Classes for teacher contact and room details',
          ],
        },
      ]
    : [
        {
          key: 'A',
          heading: 'For administrators',
          steps: [
            'Create and manage staff accounts under Teachers',
            'Set up course rosters in Classes and Enrollments',
            'Manage student accounts and login credentials in Students',
          ],
        },
        {
          key: 'B',
          heading: 'For teaching staff',
          steps: [
            'Publish Assignments and broadcast Announcements',
            'Take the daily register in Attendance',
            'Review work in Submissions and enter Grades',
          ],
        },
      ];

  return (
    <div>
      {/* ================= MASTHEAD ================= */}
      <section className="relative overflow-hidden border-b border-rule px-6 pb-12 pt-12 sm:px-8 lg:px-12 lg:pb-20 lg:pt-20">
        {/* The grid, made briefly visible */}
        <div
          className="grid-guides pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 opacity-60 lg:block"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl">
          <div className="anim-rise flex items-center gap-5">
            <span className="micro micro-signal shrink-0">{eyebrow}</span>
            <span className="anim-rule lag-2 h-px flex-1 bg-rule" />
          </div>

          <h1 className="display anim-wipe lag-1 mt-8 text-[clamp(3rem,10vw,7rem)] lg:mt-10">
            {headline}
          </h1>

          <p className="anim-rise lag-3 mt-8 max-w-xl text-[0.9375rem] leading-[1.7] text-muted-foreground">
            {subtitle}
          </p>

          {!isAuthenticated && (
            <div className="anim-rise lag-4 mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex h-11 items-center bg-foreground px-6 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-background transition-colors duration-100 hover:bg-signal"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center border border-rule px-6 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-foreground transition-colors duration-100 hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Register as staff
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================= COUNTERS ================= */}
      <CounterBand>
        <Counter
          label="Classes on record"
          value={classes.data?.length}
          isLoading={classes.isPending}
          isError={classes.isError}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Assignments set"
          value={assignments.data?.length}
          isLoading={assignments.isPending}
          isError={assignments.isError}
          className="border-b border-rule sm:border-b-0 sm:border-r"
        />
        <Counter
          label="Announcements posted"
          value={announcements.data?.length}
          isLoading={announcements.isPending}
          isError={announcements.isError}
        />
      </CounterBand>

      {/* ================= MODULE REGISTER ================= */}
      <section>
        <div className="flex items-center justify-between gap-4 border-b border-rule px-6 py-4 sm:px-8 lg:px-12">
          <span className="micro micro-ink">Module register</span>
          <span className="index-numeral text-[0.6875rem] text-muted-foreground">
            {ordinal(modules.length)} entries
          </span>
        </div>

        <div className="stagger">
          {modules.map((entry, i) => (
            <Link
              key={entry.path}
              to={entry.path}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-5 border-b border-rule px-6 py-5 transition-colors duration-100 hover:bg-foreground sm:px-8 lg:grid-cols-[3rem_4.5rem_12rem_1fr_5rem_1.5rem] lg:gap-x-8 lg:px-12"
            >
              <span className="index-numeral text-[0.6875rem] text-muted-foreground transition-colors duration-100 group-hover:text-signal">
                {ordinal(i + 1)}
              </span>

              {/* At lg this wrapper dissolves into the row grid (display: contents),
                  so code / title / description each occupy their own column. */}
              <span className="flex flex-col gap-2 lg:contents">
                <span className="micro micro-signal transition-colors duration-100 group-hover:text-signal">
                  {entry.code}
                </span>
                <span className="text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-foreground transition-colors duration-100 group-hover:text-background">
                  {entry.title}
                </span>
                <span className="text-[0.8125rem] leading-snug text-muted-foreground transition-colors duration-100 group-hover:text-background/60">
                  {entry.description}
                </span>
              </span>

              <span
                className={cn(
                  'micro justify-self-end transition-colors duration-100 group-hover:text-background/60',
                  entry.access === 'OPEN' ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {entry.access}
              </span>

              <span
                className="hidden justify-self-end text-foreground transition-transform duration-150 group-hover:translate-x-1 group-hover:text-background lg:block"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= PROCEDURE ================= */}
      <section className="grid border-b border-rule lg:grid-cols-2">
        {procedures.map((column, ci) => (
          <div
            key={column.key}
            className={cn(
              'px-6 py-10 sm:px-8 lg:px-12 lg:py-14',
              ci === 0 ? 'border-b border-rule lg:border-b-0 lg:border-r' : ''
            )}
          >
            <div className="flex items-baseline gap-4">
              <span className="index-numeral text-[0.6875rem] text-signal">{column.key}</span>
              <h2 className="text-[1.125rem] font-semibold tracking-[-0.025em]">{column.heading}</h2>
            </div>

            <ol className="mt-8">
              {column.steps.map((step, si) => (
                <li
                  key={step}
                  className="grid grid-cols-[2rem_1fr] gap-5 border-t border-rule py-4 last:border-b"
                >
                  <span className="index-numeral pt-0.5 text-[0.6875rem] text-muted-foreground">
                    {ordinal(si + 1)}
                  </span>
                  <span className="text-[0.875rem] leading-[1.65] text-foreground/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      {/* ================= COLOPHON ================= */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-6 sm:px-8 lg:px-12">
        <span className="micro">Classroom management system</span>
        <span className="index-numeral text-[0.6875rem] text-muted-foreground">
          {isAuthenticated ? `SESSION · ${eyebrow.toUpperCase()}` : 'NO SESSION'}
        </span>
      </footer>
    </div>
  );
}
