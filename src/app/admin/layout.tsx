import { requireAdmin } from '@/lib/auth';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminNavigation admin={admin}>
      {children}
    </AdminNavigation>
  );
}
