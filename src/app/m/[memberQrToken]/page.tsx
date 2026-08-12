import { createClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';
import { ShieldCheck, ShieldAlert, User, Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ memberQrToken: string }>;
}

export const dynamic = 'force-dynamic';

export default async function MemberQrResolverPage({ params }: PageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.memberQrToken;
  
  const adminSession = await getAdminSession();
  const supabase = await createClient();

  // Find the member details (we can query this on server side safely)
  const { data: member, error } = await supabase
    .from('club_members')
    .select('member_code, full_name, position, qr_status, is_active')
    .eq('member_qr_token', token)
    .single();

  const isValidToken = !!member;
  const isAuthorized = !!adminSession;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 px-4 py-12 sm:px-6 lg:px-8 text-white font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {isAuthorized && isValidToken ? (
        /* Admin context: show member details */
        <div className="w-full max-w-md bg-slate-900 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl shadow-2xl relative">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/30 mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 mb-3">
              CRR-Verifier Mode
            </span>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Identity Resolved</h2>
            <p className="text-sm text-slate-400 mt-1">Credential verified from secure token</p>
          </div>

          <div className="mt-6 border-t border-slate-850 pt-5 space-y-4">
            <div className="flex justify-between items-start gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase shrink-0">Full Name</span>
              <span className="font-bold text-slate-200 text-right break-words">{member.full_name}</span>
            </div>
            <div className="flex justify-between items-start gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase shrink-0">Position</span>
              <span className="font-bold text-indigo-400 text-right break-words">{member.position}</span>
            </div>
            <div className="flex justify-between items-start gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase">Member Code</span>
              <span className="font-mono font-bold text-slate-350">{member.member_code}</span>
            </div>
            <div className="flex justify-between items-start gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase">QR Code Status</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                member.qr_status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {member.qr_status === 'active' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {member.qr_status}
              </span>
            </div>
            <div className="flex justify-between items-start gap-3 text-xs">
              <span className="text-slate-500 font-semibold uppercase">Roster Status</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                member.is_active ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {member.is_active ? 'Active Member' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href="/admin/scanner"
              className="flex-1 inline-flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-600/10"
            >
              Open Scanner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Public view or invalid token: show generic lock message */
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-850 p-6 sm:p-8 rounded-2xl backdrop-blur-md shadow-2xl text-center space-y-6">
          <div className="p-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-full inline-block">
            <ShieldAlert className="h-8 w-8 text-slate-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">SECURE IDENTIFICATION</h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto">
              This is a secure membership ID credential. Authentication is required to resolve this signature.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-850">
            <Link
              href="/login"
              className="inline-flex justify-center py-2.5 px-6 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-850 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
