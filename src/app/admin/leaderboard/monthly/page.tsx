import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { Trophy, Award, TrendingUp, Percent, UserCheck } from 'lucide-react';
import { MonthPicker } from '@/components/leaderboards/MonthPicker';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function MonthlyLeaderboardPage({ searchParams }: PageProps) {
  await requireAdmin();
  const resolvedParams = await searchParams;

  // Determine target month and year in Kolkata timezone by default
  const kolkataTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const kolkataDate = new Date(kolkataTime);
  
  const month = Number(resolvedParams.month) || (kolkataDate.getMonth() + 1);
  const year = Number(resolvedParams.year) || kolkataDate.getFullYear();

  const supabase = await createClient();

  // Query Monthly Leaderboard via RPC
  const { data: leaderboard, error } = await supabase.rpc('get_monthly_leaderboard', {
    p_month: month,
    p_year: year
  });

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
  }

  // Month name helper
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  // Top 3 Cards
  const top3 = leaderboard ? leaderboard.slice(0, 3) : [];

  return (
    <div className="space-y-6">
      {/* Title / Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-indigo-400 shrink-0" />
            Monthly Standings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse points rankings, event attendance rates, and averages calculated for {monthName} {year}.
          </p>
        </div>
        
        <MonthPicker />
      </div>

      {/* Podium (Top 3 Visuals) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end pt-4 max-w-4xl mx-auto">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 sm:order-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center sm:h-[180px] justify-center relative">
              <span className="absolute top-3 left-4 text-slate-500 font-extrabold text-xs">#2</span>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-400/10 text-slate-300 font-bold border border-slate-400/20 text-sm">2</div>
              <h3 className="font-bold text-slate-200 mt-3 truncate w-full">{top3[1].full_name}</h3>
              <p className="text-[10px] text-slate-500 font-semibold truncate w-full">{top3[1].position}</p>
              <p className="text-indigo-400 font-black text-sm mt-2">+{Number(top3[1].total_points)} PTS</p>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="order-1 sm:order-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/20 text-center flex flex-col items-center sm:h-[210px] justify-center relative shadow-lg shadow-indigo-500/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 p-1 bg-amber-500 rounded-lg text-slate-950">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="absolute top-3 left-4 text-amber-400 font-extrabold text-xs">#1</span>
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-base">1</div>
              <h3 className="font-extrabold text-slate-100 mt-3 truncate w-full text-base">{top3[0].full_name}</h3>
              <p className="text-[10px] text-indigo-300 font-bold truncate w-full uppercase tracking-wider">{top3[0].position}</p>
              <p className="text-emerald-400 font-black text-base mt-2">+{Number(top3[0].total_points)} PTS</p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center sm:h-[160px] justify-center relative">
              <span className="absolute top-3 left-4 text-slate-500 font-extrabold text-xs">#3</span>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-700/10 text-yellow-600 font-bold border border-yellow-700/20 text-sm">3</div>
              <h3 className="font-bold text-slate-200 mt-3 truncate w-full">{top3[2].full_name}</h3>
              <p className="text-[10px] text-slate-500 font-semibold truncate w-full">{top3[2].position}</p>
              <p className="text-indigo-400 font-black text-sm mt-2">+{Number(top3[2].total_points)} PTS</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard — stacked cards on phones, table from md up */}
      <div className="md:hidden space-y-3">
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
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-indigo-400 leading-none">{Number(row.total_points)}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">POINTS</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-850 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-200 text-sm font-bold">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                    {Number(row.events_attended)}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Events</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-200 text-sm font-bold">
                    <Award className="h-3.5 w-3.5 text-indigo-400" />
                    {Number(row.average_score)}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Avg Score</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-200 text-sm font-bold">
                    <Percent className="h-3.5 w-3.5 text-indigo-400" />
                    {Number(row.attendance_percentage)}%
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Attendance</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm px-4">
            No events held or member scores recorded for {monthName} {year}.
          </div>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="hidden md:block p-5 rounded-2xl bg-slate-900 border border-slate-800/80">
        {leaderboard && leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-center">Events Attended</th>
                  <th className="py-3 px-4 text-center">Average Score</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Total Points</th>
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
                    <td className="py-3.5 px-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-1.5 text-slate-300">
                        <UserCheck className="h-4 w-4 text-indigo-400" />
                        {Number(row.events_attended)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-slate-300">
                        <Award className="h-4 w-4 text-indigo-400" />
                        {Number(row.average_score)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-slate-300 font-semibold">
                        <Percent className="h-4 w-4 text-indigo-400" />
                        {Number(row.attendance_percentage)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-indigo-400">
                      {Number(row.total_points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No events held or member scores recorded for {monthName} {year}.
          </div>
        )}
      </div>
    </div>
  );
}
