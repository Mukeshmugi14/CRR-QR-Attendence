import { createClient } from '@/lib/supabase/server';
import { IdCardGenerator } from '@/components/id-cards/IdCardGenerator';
import { CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const [membersResult, qrGeneratedResult, qrRevokedResult] = await Promise.all([
    supabase
      .from('club_members')
      .select('*')
      .eq('is_active', true)
      .order('member_code', { ascending: true }),
    supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('qr_status', 'active'),
    supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('qr_status', 'revoked'),
  ]);

  const members = membersResult.data;
  const error = membersResult.error;
  const qrGenerated = qrGeneratedResult.count;
  const qrRevoked = qrRevokedResult.count;

  if (error) {
    console.error('Error fetching members for ID cards:', error);
  }

  const stats = {
    total: members?.length || 0,
    qrGenerated: qrGenerated || 0,
    qrRevoked: qrRevoked || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-indigo-400 shrink-0" />
            Club ID Card Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and export professional, printable membership ID cards containing permanent identity QR codes.
          </p>
        </div>
      </div>

      <IdCardGenerator 
        members={members || []} 
        stats={stats} 
        initialSelectedId={resolvedParams.member || ''} 
      />
    </div>
  );
}
