'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function processMemberQrScan(memberQrToken: string, eventId?: string) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    
    // Server time (authoritative clock)
    const now = new Date().toISOString();

    const { data, error } = await supabase.rpc('record_id_card_attendance', {
      p_member_qr_token: memberQrToken,
      p_scanned_by: admin.userId,
      p_now: now,
      p_event_id: eventId || null
    });

    if (error) throw error;

    // The RPC returns a single row matching our schema return fields:
    // success, message, member_name, member_position, event_name, scan_time, score, timing_category, minutes_from_start, already_exists
    const result = data && data.length > 0 ? data[0] : null;

    if (!result) {
      return { success: false, error: 'Database returned empty scan response.' };
    }

    return {
      success: result.success,
      message: result.message,
      memberName: result.member_name,
      memberPosition: member_position_alias(result.member_position),
      eventName: result.event_name,
      scanTime: result.scan_time,
      score: result.score,
      timingCategory: result.timing_category,
      minutesFromStart: result.minutes_from_start,
      alreadyExists: result.already_exists
    };
  } catch (error: any) {
    console.error('Error scanning QR:', error);
    return { success: false, error: error.message || 'Server action failure.' };
  }
}

// Quick helper to cleanup position titles
function member_position_alias(pos: string | null): string {
  if (!pos) return 'MEMBER';
  return pos.toUpperCase();
}

export async function getActiveEventsList() {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase.rpc('get_current_active_event', {
      p_now: now
    });

    if (error) throw error;
    return { success: true, events: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
