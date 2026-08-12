'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function fetchReportData(type: 'monthly' | 'alltime', month: number, year: number) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    if (type === 'monthly') {
      const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
        p_month: month,
        p_year: year
      });
      if (error) throw error;
      
      // Get count of completed events this month to show on report
      const { count: eventCount, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('event_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('event_date', `${year}-${String(month).padStart(2, '0')}-31`);

      return { 
        success: true, 
        data: data || [], 
        meta: { 
          totalEvents: eventCount || 0,
          monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
        } 
      };
    } else {
      const { data, error } = await supabase.rpc('get_all_time_leaderboard');
      if (error) throw error;
      return { success: true, data: data || [], meta: {} };
    }
  } catch (error: any) {
    console.error('Report fetch error:', error);
    return { success: false, error: error.message };
  }
}
