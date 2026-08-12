'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePresident } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createSergeantAccount(email: string, password: string) {
  try {
    // 1. Verify creator is the President
    await requirePresident();

    // 2. Instantiate Supabase admin client (Service Role)
    const adminSupabase = createAdminClient();

    // 3. Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true // bypass verification link
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create Auth user.');
    }

    // 4. Create the role entry in admin_users
    const { error: roleError } = await adminSupabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        role: 'sergeant'
      });

    if (roleError) {
      // Cleanup auth user if role assignment fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating sergeant:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchSergeantAccounts() {
  try {
    await requirePresident();
    const adminSupabase = createAdminClient();

    // Fetch users joined with admin_users where role is sergeant
    // Note: auth.users is in auth schema, but we can list users via auth.admin API!
    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) throw listError;

    const { data: adminRoles, error: roleError } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('role', 'sergeant');

    if (roleError) throw roleError;

    const sergeantIds = new Set(adminRoles.map(r => r.user_id));

    const sergeants = authUsers.users
      .filter(u => sergeantIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email || '',
        createdAt: u.created_at
      }));

    return { success: true, sergeants };
  } catch (error: any) {
    console.error('Error listing sergeants:', error);
    return { success: false, error: error.message, sergeants: [] };
  }
}
