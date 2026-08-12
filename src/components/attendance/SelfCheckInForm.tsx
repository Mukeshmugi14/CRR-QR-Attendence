'use client';

import { useState } from 'react';
import { processSelfCheckin } from '@/app/attendance/[eventQrToken]/actions';
import { formatTime, formatDate } from '@/lib/utils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Briefcase, 
  Clock, 
  ArrowRight,
  Loader2,
  Lock,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface SelfCheckInFormProps {
  event: Event;
  token: string;
}

export function SelfCheckInForm({ event, token }: SelfCheckInFormProps) {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInData, setCheckInData] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !position.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await processSelfCheckin(token, fullName, position);
      if (res.success) {
        setCheckInData(res);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setError(res.error || 'Member details not found. Please check your name and club position.');
      }
    } catch (err: any) {
      setError('Member details not found. Please check your name and club position.');
    } finally {
      setLoading(false);
    }
  };

  if (checkInData) {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/20 p-8 rounded-2xl text-center space-y-6 shadow-2xl relative">
        <div className="absolute inset-0 bg-emerald-500/[0.01] rounded-2xl pointer-events-none" />
        
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 inline-block scale-up">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">ATTENDANCE RECORDED</h2>
          <p className="text-lg font-bold text-slate-200 mt-2">{checkInData.memberName}</p>
          <p className="text-xs text-indigo-400 uppercase tracking-wider font-extrabold">{checkInData.memberPosition}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-3 text-left text-xs">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-500 font-medium">Event Name</span>
            <span className="font-bold text-slate-300">{checkInData.eventName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-500 font-medium">Scan Time</span>
            <span className="font-bold text-slate-350">{formatTime(checkInData.scanTime)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-500 font-medium">Arrival</span>
            <span className="font-bold text-slate-350">{checkInData.timingCategory}</span>
          </div>
          <div className="flex justify-between items-center pt-1 font-semibold text-sm">
            <span className="text-slate-400">Points Awarded</span>
            <span className="font-black text-emerald-400">+{checkInData.score} PTS</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Check-in recorded from your mobile browser. Thank you for attending!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900/60 border border-slate-850 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative">
      <div className="flex flex-col items-center mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg mb-4">
          <QrCode className="h-6 w-6" />
        </div>
        <h2 className="text-center text-2xl font-black tracking-tight text-white uppercase">
          Club Attendance
        </h2>
        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">
          {event.name}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {formatDate(event.event_date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-250 text-xs mb-5 flex items-start gap-2.5">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
              Full Name
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-4.5 w-4.5" />
              </div>
              <input
                id="full-name"
                type="text"
                required
                disabled={loading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="RTR. MUKESH"
              />
            </div>
          </div>

          <div>
            <label htmlFor="position" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
              Club Position
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <input
                id="position"
                type="text"
                required
                disabled={loading}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="DEPUTY SERGEANT AT ARMS"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !fullName.trim() || !position.trim()}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Attendance'
          )}
        </button>
      </form>
    </div>
  );
}
