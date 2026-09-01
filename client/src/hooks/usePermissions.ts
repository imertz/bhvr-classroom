import { useAuthStore } from '../stores/authStore';

export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAdmin: boolean;
  canManageTeachers: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isAuthenticated: boolean;
  userRole: string | null;
}

export const usePermissions = (): Permissions => {
  const { isAuthenticated, user } = useAuthStore();
  
  const userRole = user?.role || null;
  const isAdmin = isAuthenticated && userRole === 'admin';
  const isTeacher = isAuthenticated && userRole === 'teacher';
  
  return {
    canCreate: isAdmin || isTeacher,
    canEdit: isAdmin || isTeacher,
    canDelete: isAdmin || isTeacher,
    canViewAdmin: isAdmin,
    canManageTeachers: isAdmin,
    isAdmin,
    isTeacher,
    isAuthenticated,
    userRole,
  };
};