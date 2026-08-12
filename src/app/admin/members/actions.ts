'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleMemberActive(memberId: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('club_members')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) throw error;
    revalidatePath('/admin/members');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling member status:', error);
    return { success: false, error: error.message };
  }
}

export async function revokeQrCode(memberId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('revoke_member_qr', {
      p_member_id: memberId
    });

    if (error) throw error;
    revalidatePath('/admin/members');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error revoking QR code:', error);
    return { success: false, error: error.message };
  }
}

export async function reissueQrCode(memberId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('reissue_member_qr', {
      p_member_id: memberId
    });

    if (error) throw error;
    revalidatePath('/admin/members');
    return { success: true, newToken: data };
  } catch (error: any) {
    console.error('Error reissuing QR code:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMemberDetails(memberId: string, details: { fullName: string; position: string; email?: string; phone?: string }) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('club_members')
      .update({
        full_name: details.fullName,
        position: details.position,
        email: details.email || null,
        phone: details.phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (error) throw error;
    revalidatePath('/admin/members');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating member:', error);
    return { success: false, error: error.message };
  }
}

export async function createMember(details: { fullName: string; position: string; email?: string; phone?: string }) {
  try {
    const supabase = await createClient();
    
    // Generate unique member code RCxxx
    const { data: countData, error: countError } = await supabase
      .from('club_members')
      .select('member_code');
      
    if (countError) throw countError;
    
    let nextNum = 1;
    if (countData && countData.length > 0) {
      const numbers = countData
        .map(d => {
          const match = d.member_code.match(/RC(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
    }
    
    const memberCode = `RC${String(nextNum).padStart(3, '0')}`;

    const { error } = await supabase
      .from('club_members')
      .insert({
        member_code: memberCode,
        full_name: details.fullName,
        position: details.position,
        email: details.email || null,
        phone: details.phone || null,
        qr_status: 'active',
        is_active: true
      });

    if (error) throw error;
    revalidatePath('/admin/members');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating member:', error);
    return { success: false, error: error.message };
  }
}
