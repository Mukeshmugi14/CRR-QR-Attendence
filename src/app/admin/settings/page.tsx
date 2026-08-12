import { requireAdmin } from '@/lib/auth';
import { fetchSergeantAccounts } from './actions';
import { SergeantManager } from '@/components/settings/SergeantManager';
import { Settings, ShieldAlert, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const isPresident = admin.role === 'president';

  let sergeantsList: any[] = [];
  if (isPresident) {
    const res = await fetchSergeantAccounts();
    if (res.success) {
      sergeantsList = res.sergeants || [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-indigo-400" />
            System Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure system configurations, manage roles, and add staff accounts.
          </p>
        </div>
      </div>

      {isPresident ? (
        <SergeantManager initialSergeants={sergeantsList} />
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <ShieldAlert className="h-12 w-12 mx-auto text-amber-500 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-450 leading-normal">
            Sergeant admin accounts can only be managed by the President. You are currently logged in as a <strong>Sergeant</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
