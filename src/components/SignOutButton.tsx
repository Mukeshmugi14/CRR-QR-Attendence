'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Loader2 } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{loading ? 'Signing Out...' : 'Sign Out'}</span>
    </button>
  );
}
