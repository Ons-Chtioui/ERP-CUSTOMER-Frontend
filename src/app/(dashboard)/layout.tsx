import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'ERP — Dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
