import { requireAdmin } from '@/lib/auth';
import { ReportsManager } from '@/components/reports/ReportsManager';
import { BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-indigo-400 shrink-0" />
            Executive Reports & Exports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Compile performance metrics, export CSV lists, and generate official monthly PDF report documents.
          </p>
        </div>
      </div>

      <ReportsManager />
    </div>
  );
}
