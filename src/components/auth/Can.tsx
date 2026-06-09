'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({
  permission,
  anyOf,
  allOf,
  role,
  fallback = null,
  children,
}: CanProps) {
  const [isClient, setIsClient] = useState(false);
  const { can, canAny, canAll, isRole } = usePermissions();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pendant le SSR, on ne rend rien (ou un fallback)
  if (!isClient) {
    return <>{fallback}</>;
  }

  let allowed = true;

  if (permission) allowed = allowed && can(permission);
  if (anyOf && anyOf.length > 0) allowed = allowed && canAny(...anyOf);
  if (allOf && allOf.length > 0) allowed = allowed && canAll(...allOf);
  if (role) allowed = allowed && isRole(role);

  return allowed ? <>{children}</> : <>{fallback}</>;
}