import { getEventDetailsByQrToken } from './actions';
import { SelfCheckInForm } from '@/components/attendance/SelfCheckInForm';
import { AlertCircle, QrCode } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ eventQrToken: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PublicAttendancePage({ params }: PageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.eventQrToken;

  const result = await getEventDetailsByQrToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 px-4 py-12 sm:px-6 lg:px-8 text-white font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      
      {result.success && result.event ? (
        <SelfCheckInForm event={result.event} token={token} />
      ) : (
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-850 p-8 rounded-2xl backdrop-blur-md shadow-2xl text-center space-y-6 relative">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-full border border-red-500/30 inline-block">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">ATTENDANCE BLOCKED</h2>
            <p className="text-sm text-slate-400 leading-normal">
              {result.error || 'Attendance is currently unavailable.'}
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex justify-center py-2.5 px-6 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
