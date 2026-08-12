'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface ImportMemberInput {
  full_name: string;
  position: string;
  email?: string | null;
  phone?: string | null;
  member_code?: string | null;
}

export async function importClubMembers(members: ImportMemberInput[]) {
  try {
    // Ensure the user is an admin
    await requireAdmin();

    const supabase = await createClient();

    // 1. Fetch current member codes to check duplicates and assign new codes
    const { data: existingMembers, error: fetchError } = await supabase
      .from('club_members')
      .select('member_code, full_name, position');

    if (fetchError) throw fetchError;

    const existingCodes = new Set(existingMembers.map(m => m.member_code.toUpperCase()));
    const existingNamePositions = new Set(
      existingMembers.map(m => `${m.full_name.trim().toLowerCase()}|${m.position.trim().toLowerCase()}`)
    );

    // Get current maximum member code sequence number
    let nextNum = 1;
    const rcNumbers = existingMembers
      .map(m => {
        const match = m.member_code.match(/RC(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));
    if (rcNumbers.length > 0) {
      nextNum = Math.max(...rcNumbers) + 1;
    }

    const toInsert: any[] = [];
    let duplicateCount = 0;
    let successCount = 0;

    for (const m of members) {
      const name = m.full_name.trim();
      const pos = m.position.trim();
      const emailVal = m.email ? m.email.trim() : null;
      const phoneVal = m.phone ? String(m.phone).trim() : null;
      
      const key = `${name.toLowerCase()}|${pos.toLowerCase()}`;

      // Duplicate check by Name + Position (case-insensitive) OR by custom code (if provided)
      if (existingNamePositions.has(key)) {
        duplicateCount++;
        continue;
      }

      let code = m.member_code ? m.member_code.trim().toUpperCase() : null;

      if (code && existingCodes.has(code)) {
        duplicateCount++;
        continue;
      }

      // Generate a member code if not provided
      if (!code) {
        code = `RC${String(nextNum).padStart(3, '0')}`;
        nextNum++;
      }

      // Insert record details
      toInsert.push({
        member_code: code,
        full_name: name,
        position: pos,
        email: emailVal,
        phone: phoneVal,
        qr_status: 'active',
        is_active: true
      });

      // Add to local sets to prevent duplicate rows in the same Excel import file
      existingCodes.add(code);
      existingNamePositions.add(key);
      successCount++;
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('club_members')
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    revalidatePath('/admin/members');

    return {
      success: true,
      imported: successCount,
      skippedDuplicates: duplicateCount
    };
  } catch (error: any) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
  }
}
