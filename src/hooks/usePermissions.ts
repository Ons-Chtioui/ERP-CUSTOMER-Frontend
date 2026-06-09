import { useAuthStore } from '@/store/auth.store';

export function usePermissions() {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuthStore();

  return {
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    role: user?.role,
    permissions: user?.permissions ?? [],
    isRole: (role: string) => user?.role === role,
  };
}
