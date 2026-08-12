'use client';

import { useState } from 'react';
import { createSergeantAccount } from '@/app/admin/settings/actions';
import { formatDate } from '@/lib/utils';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Users,
  ShieldCheck
} from 'lucide-react';

interface Sergeant {
  id: string;
  email: string;
  createdAt: string;
}

interface SergeantManagerProps {
  initialSergeants: Sergeant[];
}

export function SergeantManager({ initialSergeants }: SergeantManagerProps) {
  const [sergeants, setSergeants] = useState<Sergeant[]>(initialSergeants);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await createSergeantAccount(email, password);
      if (res.success) {
        setSuccess(true);
        setEmail('');
        setPassword('');
        // Reload list
        window.location.reload();
      } else {
        setError(res.error || 'Failed to create Sergeant account.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Creation form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
          <UserPlus className="h-4.5 w-4.5 text-indigo-400" /> Add Sergeant Account
        </h3>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-350 text-xs flex gap-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>Sergeant account created successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="mt-1.5 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sergeant@rotaract.org"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="mt-1.5 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create Account
          </button>
        </form>
      </div>

      {/* Sergeants List */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-indigo-400" /> Active Sergeant Accounts
        </h3>

        {sergeants.length > 0 ? (
          <div className="space-y-3">
            {sergeants.map((sg) => (
              <div 
                key={sg.id} 
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{sg.email}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Created on: {formatDate(sg.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    sergeant
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No Sergeant accounts registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
