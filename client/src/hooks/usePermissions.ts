import { useAuthStore } from '../stores/authStore';

export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAdmin: boolean;
  isAuthenticated: boolean;
  userRole: string | null;
}

export const usePermissions = (): Permissions => {
  const { isAuthenticated, user } = useAuthStore();
  
  const userRole = user?.role || null;
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  
  return {
    canCreate: isAuthenticated && (isAdmin || isTeacher),
    canEdit: isAuthenticated && (isAdmin || isTeacher),
    canDelete: isAuthenticated && (isAdmin || isTeacher),
    canViewAdmin: isAuthenticated && isAdmin,
    isAuthenticated,
    userRole,
  };
};