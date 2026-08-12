import { createClient } from '@/lib/supabase/server';
import { MembersTable } from '@/components/members/MembersTable';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('club_members')
    .select('*')
    .order('member_code', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400 shrink-0" />
            Club Members Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your club's roster, generate permanent QR codes, toggle statuses, and edit member details.
          </p>
        </div>
      </div>

      <MembersTable initialMembers={members || []} />
    </div>
  );
}
