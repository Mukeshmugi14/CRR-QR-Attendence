import { createClient } from '@/lib/supabase/server';
import { 
  Users, 
  Calendar, 
  Activity, 
  Award, 
  Percent, 
  TrendingUp,
  Clock,
  ArrowRight,
  QrCode,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Get current month/year in Kolkata timezone
  const kolkataTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const kolkataDate = new Date(kolkataTime);
  const currentMonth = kolkataDate.getMonth() + 1;
  const currentYear = kolkataDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  // Fetch all dashboard data in parallel to reduce database round-trip latency
  const [
    totalMembersResult,
    activeMembersResult,
    eventsThisMonthResult,
    activeEventsResult,
    monthlyLeaderboardResult,
    allTimeLeaderboardResult,
    recentAttendanceResult,
    recentEventsResult
  ] = await Promise.all([
    supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', firstDayOfMonth)
      .lte('event_date', lastDayOfMonth)
      .in('status', ['active', 'completed', 'scheduled']),
    supabase.rpc('get_current_active_event', {
      p_now: now
    }),
    supabase.rpc('get_monthly_leaderboard', {
      p_month: currentMonth,
      p_year: currentYear
    }),
    supabase.rpc('get_all_time_leaderboard'),
    supabase
      .from('attendance')
      .select(`
        id,
        scanned_at,
        score,
        timing_category,
        attendance_method,
        club_members (
          full_name,
          position
        ),
        events (
          name
        )
      `)
      .order('scanned_at', { ascending: false })
      .limit(5),
    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(5)
  ]);

  const totalMembers = totalMembersResult.count;
  const activeMembers = activeMembersResult.count;
  const eventsThisMonth = eventsThisMonthResult.count;
  
  const activeEvent = activeEventsResult.data && activeEventsResult.data.length > 0 ? activeEventsResult.data[0] : null;
  
  const monthlyLeaderboard = monthlyLeaderboardResult.data;
  const topMonthly = monthlyLeaderboard && monthlyLeaderboard.length > 0 ? monthlyLeaderboard[0] : null;

  const allTimeLeaderboard = allTimeLeaderboardResult.data;
  const topAllTime = allTimeLeaderboard && allTimeLeaderboard.length > 0 ? allTimeLeaderboard[0] : null;

  const recentAttendance = recentAttendanceResult.data;
  const recentEvents = recentEventsResult.data;

  // Calculate attendance % for active event
  const attendancePercentage = activeEvent && activeEvent.total_members > 0
    ? Math.round((Number(activeEvent.present_count) / Number(activeEvent.total_members)) * 100)
    : 0;

  // Stats definition
  const stats = [
    { name: 'Total Members', value: totalMembers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Active Members', value: activeMembers || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Events This Month', value: eventsThisMonth || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Active Today Check-in', value: activeEvent ? `${activeEvent.present_count} Present` : 'No Active Event', icon: Activity, color: activeEvent ? 'text-amber-400' : 'text-slate-400', bg: activeEvent ? 'bg-amber-500/10' : 'bg-slate-500/5' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white sm:text-3xl">Club Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage events, scan club ID cards, view leaderboards, and print reports.</p>
        </div>
        <div className="shrink-0">
          <Link
            href="/admin/scanner"
            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <QrCode className="h-4 w-4" />
            Launch Scanner
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400">{stat.name}</p>
                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-extrabold text-slate-100 break-words">{stat.value}</p>
              </div>
              <div className={`hidden sm:block p-3.5 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Event section */}
      {activeEvent && (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/30 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6 relative z-10">
            <div className="space-y-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                🔴 Active Event Today
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 break-words">{activeEvent.name}</h2>
              <p className="text-sm text-slate-400">{activeEvent.description || 'No description provided.'}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0" /> {new Date(activeEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeEvent.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="hidden sm:inline">•</span>
                <span>Date: {new Date(activeEvent.event_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-800 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 shrink-0">
              <div className="text-center px-3">
                <p className="text-xl sm:text-2xl font-black text-slate-100">{Number(activeEvent.present_count)} / {Number(activeEvent.total_members)}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Present Members</p>
              </div>
              <div className="text-center px-3">
                <div className="flex items-center gap-1 justify-center">
                  <Percent className="h-4 w-4 text-indigo-400 shrink-0" />
                  <p className="text-xl sm:text-2xl font-black text-slate-100">{attendancePercentage}%</p>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers & Activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Activity logs & Recent events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Scans */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">Recent Scans</h3>
              <Link href="/admin/scanner" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Scanner <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAttendance && recentAttendance.length > 0 ? (
              <>
              {/* Phones: one stacked row per scan instead of a sideways-scrolling table */}
              <div className="sm:hidden space-y-2.5">
                {recentAttendance.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 break-words">{log.club_members?.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium break-words">{log.club_members?.position}</p>
                      </div>
                      <span className="text-sm font-black text-indigo-400 shrink-0">+{log.score}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        log.attendance_method === 'id_card_scan'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.attendance_method === 'id_card_scan' ? 'ID Card' : 'Self'}
                      </span>
                      <span>{new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="truncate">{log.events?.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 text-xs font-bold">
                      <th className="py-2.5">Member</th>
                      <th className="py-2.5">Event</th>
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">Method</th>
                      <th className="py-2.5 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((log: any) => (
                      <tr key={log.id} className="border-b border-slate-850/60 hover:bg-slate-850/20 text-slate-300">
                        <td className="py-3 font-semibold text-slate-200">
                          {log.club_members?.full_name}
                          <span className="block text-[10px] text-slate-500 font-medium">{log.club_members?.position}</span>
                        </td>
                        <td className="py-3 text-xs max-w-[150px] truncate">{log.events?.name}</td>
                        <td className="py-3 text-xs text-slate-400">
                          {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.attendance_method === 'id_card_scan'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.attendance_method === 'id_card_scan' ? 'ID Card' : 'Self'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-indigo-400">+{log.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No scans recorded yet.</div>
            )}
          </div>

          {/* Recent Events */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">Event Logs</h3>
              <Link href="/admin/events" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentEvents && recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-colors">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 break-words">{evt.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(evt.event_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        evt.status === 'completed' ? 'bg-slate-800 text-slate-400' :
                        evt.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        evt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {evt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No events created yet.</div>
            )}
          </div>
        </div>

        {/* Right column: Top Performers & Scoring Card */}
        <div className="space-y-6">
          {/* Top Performers Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 mb-5 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" /> Top Performers
            </h3>
            
            <div className="space-y-6">
              {/* Monthly Performer */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Top Monthly Performer</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                {topMonthly ? (
                  <div className="mt-3">
                    <p className="text-base font-bold text-slate-200">{topMonthly.full_name}</p>
                    <p className="text-xs text-slate-400">{topMonthly.position}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-850 pt-2.5">
                      <span>Events: <strong className="text-slate-300">{Number(topMonthly.events_attended)}</strong></span>
                      <span>Total Pts: <strong className="text-indigo-400">{Number(topMonthly.total_points)}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">No monthly stats available.</p>
                )}
              </div>

              {/* All-Time Performer */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Top All-Time Performer</span>
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                {topAllTime ? (
                  <div className="mt-3">
                    <p className="text-base font-bold text-slate-200">{topAllTime.full_name}</p>
                    <p className="text-xs text-slate-400">{topAllTime.position}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-850 pt-2.5">
                      <span>Events: <strong className="text-slate-300">{Number(topAllTime.events_attended)}</strong></span>
                      <span>Total Pts: <strong className="text-purple-400">{Number(topAllTime.total_points)}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">No all-time stats available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs leading-relaxed space-y-3">
            <h4 className="font-bold text-slate-200 text-sm">Attendance Guidelines</h4>
            <p>1. Ensure your device is configured to the <strong>Asia/Kolkata</strong> timezone.</p>
            <p>2. Keep the event status <strong>ACTIVE</strong> or <strong>SCHEDULED</strong> to scan and register attendance.</p>
            <p>3. Scanner resolves timing scores automatically according to the active event's scoring configuration rules.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
