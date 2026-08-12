'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface EventInput {
  name: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // ISO string
  end_time: string; // ISO string
  attendance_cutoff_time?: string | null; // ISO string or null
  status?: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export async function createEvent(input: EventInput) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: input.name,
        description: input.description || null,
        event_date: input.event_date,
        start_time: input.start_time,
        end_time: input.end_time,
        attendance_cutoff_time: input.attendance_cutoff_time || null,
        status: input.status || 'scheduled',
        created_by: admin.userId
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/admin/events');
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('Error creating event:', error);
    return { success: false, error: error.message };
  }
}

export async function updateEvent(eventId: string, input: Partial<EventInput>) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const updateData: any = {
      name: input.name,
      description: input.description,
      event_date: input.event_date,
      start_time: input.start_time,
      end_time: input.end_time,
      attendance_cutoff_time: input.attendance_cutoff_time,
      updated_at: new Date().toISOString()
    };

    if (input.status) {
      updateData.status = input.status;
    }

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (error) throw error;

    revalidatePath('/admin/events');
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelEvent(eventId: string) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('events')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) throw error;

    revalidatePath('/admin/events');
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling event:', error);
    return { success: false, error: error.message };
  }
}

export async function updateScoringRules(
  eventId: string,
  rules: Array<{ id?: string; rule_type: string; min_minutes: number; max_minutes: number | null; score: number; label: string }>
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // 1. Delete all current rules
    const { error: deleteError } = await supabase
      .from('event_scoring_rules')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) throw deleteError;

    // 2. Insert new ones
    const rulesToInsert = rules.map(r => ({
      event_id: eventId,
      rule_type: r.rule_type,
      min_minutes: r.min_minutes,
      max_minutes: r.max_minutes,
      score: r.score,
      label: r.label
    }));

    if (rulesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('event_scoring_rules')
        .insert(rulesToInsert);

      if (insertError) throw insertError;
    }

    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating scoring rules:', error);
    return { success: false, error: error.message };
  }
}
