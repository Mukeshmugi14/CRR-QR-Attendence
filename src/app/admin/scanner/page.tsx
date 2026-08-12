import { getActiveEventsList } from '@/app/admin/scanner/actions';
import { AttendanceScanner } from '@/components/scanner/AttendanceScanner';
import { QrCode } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ScannerPage() {
  const result = await getActiveEventsList();
  const activeEvents = result.success ? result.events : [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <QrCode className="h-6 w-6 text-indigo-400" />
          Event Attendance Scanner
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Scans physical ID cards and automatically registers attendance for the active event.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <AttendanceScanner initialActiveEvents={activeEvents || []} />
      </div>
    </div>
  );
}
