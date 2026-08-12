'use server';

import { createClient } from '@/lib/supabase/server';

export async function processSelfCheckin(eventQrToken: string, fullName: string, position: string) {
  try {
    const supabase = await createClient();
    
    // Authoritative server timestamp
    const now = new Date().toISOString();

    const { data, error } = await supabase.rpc('record_self_checkin', {
      p_event_qr_token: eventQrToken,
      p_full_name: fullName.trim(),
      p_position: position.trim(),
      p_now: now
    });

    if (error) {
      throw error;
    }

    const result = data && data.length > 0 ? data[0] : null;

    if (!result) {
      return { success: false, error: 'Member details not found. Please check your name and club position.' };
    }

    if (!result.success) {
      // Return custom message from database function (e.g. cutoff times, already checked in, invalid, etc.)
      return { 
        success: false, 
        error: result.message || 'Member details not found. Please check your name and club position.' 
      };
    }

    return {
      success: true,
      message: result.message,
      memberName: result.member_name,
      memberPosition: result.member_position,
      eventName: result.event_name,
      scanTime: result.scan_time,
      score: result.score,
      timingCategory: result.timing_category,
      minutesFromStart: result.minutes_from_start,
      alreadyExists: result.already_exists
    };
  } catch (error: any) {
    console.error('Self check-in error:', error);
    return { 
      success: false, 
      error: 'Member details not found. Please check your name and club position.' 
    };
  }
}

export async function getEventDetailsByQrToken(eventQrToken: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('id, name, description, event_date, start_time, end_time, status, attendance_cutoff_time')
      .eq('event_qr_token', eventQrToken)
      .single();

    if (error || !data) {
      return { success: false, error: 'Attendance link is no longer valid.' };
    }

    if (data.status === 'cancelled') {
      return { success: false, error: 'Attendance is unavailable for this event.' };
    }

    if (data.status === 'completed') {
      return { success: false, error: 'Attendance is currently unavailable.' };
    }

    // Check cutoff bounds
    if (data.attendance_cutoff_time) {
      const cutoff = new Date(data.attendance_cutoff_time);
      if (new Date() > cutoff) {
        return { success: false, error: 'Attendance is currently unavailable.' };
      }
    }

    return { success: true, event: data };
  } catch (error: any) {
    return { success: false, error: 'Attendance is currently unavailable.' };
  }
}
