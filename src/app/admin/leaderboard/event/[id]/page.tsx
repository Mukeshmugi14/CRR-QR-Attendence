import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { Trophy, Calendar, Clock, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EventExportExcelButton } from '@/components/leaderboards/EventExportExcelButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EventLeaderboardPage({ params }: PageProps) {
  await requireAdmin();
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  
  const supabase = await createClient();

  // 1. Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('name, event_date, start_time, end_time, status')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-slate-400 font-bold">Event not found.</p>
        <Link href="/admin/events" className="text-indigo-400 text-xs mt-2 inline-block">Back to Events</Link>
      </div>
    );
  }

  // 2. Fetch event leaderboard via RPC
  const { data: leaderboard, error: leaderboardError } = await supabase.rpc('get_event_leaderboard', {
    p_event_id: eventId
  });

  if (leaderboardError) {
    console.error('Leaderboard error:', leaderboardError);
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <Link
            href="/admin/events"
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <span className="inline-flex px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold uppercase border border-indigo-500/20 mb-1">
              Leaderboard
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 break-words">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {new Date(event.event_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <EventExportExcelButton eventId={eventId} eventName={event.name} />
        </div>
      </div>


      {/* Standings — stacked cards on phones, table from md up */}
      <div className="md:hidden space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Event Standings
        </h3>

        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((row: any) => (
            <div key={row.member_id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-start gap-3">
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  row.rank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                  row.rank === 2 ? 'bg-slate-400/10 text-slate-300 border border-slate-400/25' :
                  row.rank === 3 ? 'bg-yellow-700/10 text-yellow-600 border border-yellow-700/25' :
                  'bg-slate-950 text-slate-500 border border-slate-850'
                }`}>
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-100 break-words">{row.full_name}</p>
                  <p className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">{row.member_code}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 break-words">{row.position}</p>
                </div>
                <span className="text-lg font-black text-emerald-400 shrink-0">+{row.score}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-850 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-400">
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  row.attendance_method === 'id_card_scan'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {row.attendance_method === 'id_card_scan' ? 'ID Card' : 'Self'}
                </span>
                <span className="font-semibold text-slate-300">
                  {new Date(row.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>
                  {row.timing_category} · {row.minutes_from_start < 0
                    ? `${Math.abs(row.minutes_from_start)} min early`
                    : `${row.minutes_from_start} min late`}
                </span>
                <span className="text-slate-500">By: {row.scanned_by_name || 'Self Check-in'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm px-4">
            No attendance check-ins recorded for this event yet.
          </div>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="hidden md:block p-5 rounded-2xl bg-slate-900 border border-slate-800/80">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Event Standings
        </h3>

        {leaderboard && leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Scan Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Scanned By</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row: any) => (
                  <tr key={row.member_id} className="border-b border-slate-850 hover:bg-slate-850/10 text-slate-300">
                    <td className="py-3.5 px-4 font-black">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        row.rank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                        row.rank === 2 ? 'bg-slate-400/10 text-slate-300 border border-slate-400/25' :
                        row.rank === 3 ? 'bg-yellow-700/10 text-yellow-600 border border-yellow-700/25' :
                        'text-slate-500'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {row.full_name}
                      <span className="block text-[10px] font-mono font-semibold text-slate-500 mt-0.5">{row.member_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-medium">{row.position}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {new Date(row.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        row.attendance_method === 'id_card_scan'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {row.attendance_method === 'id_card_scan' ? 'ID Card' : 'Self'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-400">{row.timing_category}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {row.minutes_from_start < 0 ? `${Math.abs(row.minutes_from_start)} min early` : `${row.minutes_from_start} min late`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                      {row.scanned_by_name || 'Self Check-in'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-400">+{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No attendance check-ins recorded for this event yet.
          </div>
        )}
      </div>
    </div>
  );
}
