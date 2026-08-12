import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AdminUser {
  userId: string;
  role: 'president' | 'sergeant';
  email: string;
}

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Query admin user role
    const { data: adminData, error: dbError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (dbError || !adminData) {
      return null;
    }

    return {
      userId: user.id,
      role: adminData.role as 'president' | 'sergeant',
      email: user.email || '',
    };
  } catch (error) {
    console.error('getAdminSession error:', error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requirePresident(): Promise<AdminUser> {
  const session = await requireAdmin();
  if (session.role !== 'president') {
    redirect('/admin?error=unauthorized');
  }
  return session;
}
