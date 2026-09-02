import type { Permissions } from '../hooks/usePermissions';

export interface NavItem {
  path: string;
  /** Four-character register code. The rail speaks in abbreviations. */
  code: string;
  label: string;
}

/**
 * Single source of truth for the module register. The rail renders it as a
 * numbered index; the masthead reads the same list to resolve the active
 * module's ordinal (e.g. 04/10).
 */
export function getNavItems({ isAdmin, isTeacher, isStudent }: Permissions): NavItem[] {
  return [
    { path: '/', code: 'HOME', label: 'Overview', show: true },
    { path: '/teachers', code: 'TCHR', label: 'Teachers', show: isAdmin },
    { path: '/students', code: 'STDN', label: 'Students', show: isAdmin || isTeacher },
    { path: '/classes', code: 'CLSS', label: isStudent ? 'My Classes' : 'Classes', show: true },
    { path: '/assignments', code: 'ASGN', label: isStudent ? 'My Assignments' : 'Assignments', show: true },
    { path: '/announcements', code: 'ANNC', label: 'Announcements', show: true },
    { path: '/submissions', code: 'SUBM', label: isStudent ? 'My Submissions' : 'Submissions', show: true },
    { path: '/enrollments', code: 'ENRL', label: 'Enrollments', show: isAdmin || isTeacher },
    { path: '/attendance', code: 'ATTN', label: isStudent ? 'My Attendance' : 'Attendance', show: true },
    { path: '/grades', code: 'GRDS', label: isStudent ? 'My Grades' : 'Grades', show: true },
  ]
    .filter((item) => item.show)
    .map(({ path, code, label }) => ({ path, code, label }));
}

export function isActivePath(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
}

/** Two-digit register ordinal: 1 → "01". */
export const ordinal = (n: number) => String(n).padStart(2, '0');
