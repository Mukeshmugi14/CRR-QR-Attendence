'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent, updateEvent, cancelEvent } from '@/app/admin/events/actions';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  X, 
  Trash2, 
  QrCode, 
  Clock, 
  Trophy, 
  Eye, 
  Users, 
  Check, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  attendance_cutoff_time: string | null;
  event_qr_token: string;
  status: string;
}

interface EventsListProps {
  initialEvents: Event[];
}

const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

function formatTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = hours.toString().padStart(2, '0');
  return `${strHours}:${minutes} ${ampm}`;
}

function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

export function EventsList({ initialEvents }: EventsListProps) {
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>(initialEvents);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeQrEvent, setActiveQrEvent] = useState<Event | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  
  // Start Time
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [startAmPm, setStartAmPm] = useState('AM');
  
  // End Time
  const [endHour, setEndHour] = useState('11');
  const [endMin, setEndMin] = useState('00');
  const [endAmPm, setEndAmPm] = useState('AM');
  
  // Cutoff Time
  const [hasCutoff, setHasCutoff] = useState(false);
  const [cutoffHour, setCutoffHour] = useState('09');
  const [cutoffMin, setCutoffMin] = useState('30');
  const [cutoffAmPm, setCutoffAmPm] = useState('AM');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || origin);
  }, []);

  const get24HourTime = (hour: string, minute: string, ampm: string) => {
    let hr = parseInt(hour, 10);
    if (ampm === 'PM' && hr < 12) {
      hr += 12;
    } else if (ampm === 'AM' && hr === 12) {
      hr = 0;
    }
    return `${hr.toString().padStart(2, '0')}:${minute}`;
  };

  const clearForm = () => {
    setName('');
    setDescription('');
    setEventDate('');
    setStartHour('09');
    setStartMin('00');
    setStartAmPm('AM');
    setEndHour('11');
    setEndMin('00');
    setEndAmPm('AM');
    setHasCutoff(false);
    setCutoffHour('09');
    setCutoffMin('30');
    setCutoffAmPm('AM');
    setError(null);
  };

  const handleEditClick = (evt: Event) => {
    setEditingEvent(evt);
    setName(evt.name);
    setDescription(evt.description || '');
    setEventDate(evt.event_date);
    
    // Parse start time
    const startDate = new Date(evt.start_time);
    const startHourStr = startDate.getHours();
    const startMinStr = startDate.getMinutes().toString().padStart(2, '0');
    const startAmPmStr = startHourStr >= 12 ? 'PM' : 'AM';
    let startHr12 = startHourStr % 12;
    if (startHr12 === 0) startHr12 = 12;
    setStartHour(startHr12.toString().padStart(2, '0'));
    setStartMin(startMinStr);
    setStartAmPm(startAmPmStr);
    
    // Parse end time
    const endDate = new Date(evt.end_time);
    const endHourStr = endDate.getHours();
    const endMinStr = endDate.getMinutes().toString().padStart(2, '0');
    const endAmPmStr = endHourStr >= 12 ? 'PM' : 'AM';
    let endHr12 = endHourStr % 12;
    if (endHr12 === 0) endHr12 = 12;
    setEndHour(endHr12.toString().padStart(2, '0'));
    setEndMin(endMinStr);
    setEndAmPm(endAmPmStr);
    
    // Parse cutoff time
    if (evt.attendance_cutoff_time) {
      setHasCutoff(true);
      const cutoffDate = new Date(evt.attendance_cutoff_time);
      const cutoffHourStr = cutoffDate.getHours();
      const cutoffMinStr = cutoffDate.getMinutes().toString().padStart(2, '0');
      const cutoffAmPmStr = cutoffHourStr >= 12 ? 'PM' : 'AM';
      let cutoffHr12 = cutoffHourStr % 12;
      if (cutoffHr12 === 0) cutoffHr12 = 12;
      setCutoffHour(cutoffHr12.toString().padStart(2, '0'));
      setCutoffMin(cutoffMinStr);
      setCutoffAmPm(cutoffAmPmStr);
    } else {
      setHasCutoff(false);
      setCutoffHour('09');
      setCutoffMin('30');
      setCutoffAmPm('AM');
    }
    
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Format times into Kolkata ISO offset strings
    // Format: YYYY-MM-DDT[HH:MM]:00+05:30
    const startTime24 = get24HourTime(startHour, startMin, startAmPm);
    const endTime24 = get24HourTime(endHour, endMin, endAmPm);
    const cutoffTime24 = hasCutoff ? get24HourTime(cutoffHour, cutoffMin, cutoffAmPm) : null;

    const formattedStart = `${eventDate}T${startTime24}:00+05:30`;
    const formattedEnd = `${eventDate}T${endTime24}:00+05:30`;
    const formattedCutoff = cutoffTime24 ? `${eventDate}T${cutoffTime24}:00+05:30` : null;

    const payload = {
      name,
      description,
      event_date: eventDate,
      start_time: formattedStart,
      end_time: formattedEnd,
      attendance_cutoff_time: formattedCutoff
    };

    try {
      if (editingEvent) {
        const res = await updateEvent(editingEvent.id, payload);
        if (res.success) {
          window.location.reload();
        } else {
          setError(res.error || "Failed to update event.");
        }
      } else {
        const res = await createEvent(payload);
        if (res.success) {
          window.location.reload();
        } else {
          setError(res.error || "Failed to create event.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this event? This will stop all attendance scans.")) return;
    
    const res = await cancelEvent(id);
    if (res.success) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
    } else {
      alert("Failed to cancel event: " + res.error);
    }
  };

  const getEventQrUrl = (token: string) => {
    return `${appUrl}/attendance/${token}`;
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">All Club Events</h3>
        <button
          onClick={() => {
            setEditingEvent(null);
            clearForm();
            setShowCreateModal(true);
          }}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-600/10"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((evt) => {
            const startDate = new Date(evt.start_time);
            const endDate = new Date(evt.end_time);
            const cutoffDate = evt.attendance_cutoff_time ? new Date(evt.attendance_cutoff_time) : null;
            
            return (
              <div 
                key={evt.id} 
                className={`p-4 sm:p-6 rounded-2xl bg-slate-900 border transition-all ${
                  evt.status === 'active'
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      evt.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      evt.status === 'completed' ? 'bg-slate-800 text-slate-400' :
                      evt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {evt.status === 'active' ? '🔴 Live Active' : evt.status}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-100 break-words">{evt.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{evt.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditClick(evt)}
                      title="Edit Event"
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:text-white text-slate-400"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    {evt.status !== 'cancelled' && evt.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelClick(evt.id)}
                        title="Cancel Event"
                        className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-400 border-t border-slate-850 pt-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-5">
                      Cutoff: {cutoffDate ? formatTime(cutoffDate) : 'No Cutoff'}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="block text-slate-500 font-medium">Event Date</span>
                    <span className="block font-bold text-slate-300">
                      {formatDate(evt.event_date)}
                    </span>
                  </div>
                </div>

                {/* Event Actions Footer */}
                <div className="mt-5 pt-4 border-t border-slate-850/60 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <button
                    onClick={() => setActiveQrEvent(evt)}
                    className="inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg bg-slate-950 sm:bg-transparent border border-slate-850 sm:border-0 px-3 py-2.5 sm:p-0 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
                  >
                    <QrCode className="h-4 w-4 shrink-0" />
                    Fallback QR
                  </button>

                  <Link
                    href={`/admin/leaderboard/event/${evt.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-800 px-3 py-2.5 sm:py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all"
                  >
                    <Trophy className="h-3.5 w-3.5 shrink-0" />
                    Leaderboard
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500">
          <Calendar className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="font-bold">No events created yet</p>
          <p className="text-xs text-slate-600 mt-1">Create a club meeting or event to start tracking attendance.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm sm:p-4">
          <div
            className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[88dvh] overflow-y-auto overscroll-contain shadow-2xl relative"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5">
              {editingEvent ? 'Modify Event Settings' : 'Create New Event'}
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly Club Meeting"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about the meeting agenda..."
                  rows={2}
                  className="mt-1.5 block w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Time</label>
                  <div className="mt-1.5 flex gap-2">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-slate-500 self-center font-bold">:</span>
                    <select
                      value={startMin}
                      onChange={(e) => setStartMin(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={startAmPm}
                      onChange={(e) => setStartAmPm(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
                  <div className="mt-1.5 flex gap-2">
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-slate-500 self-center font-bold">:</span>
                    <select
                      value={endMin}
                      onChange={(e) => setEndMin(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={endAmPm}
                      onChange={(e) => setEndAmPm(e.target.value)}
                      className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      id="enableCutoff"
                      checked={hasCutoff}
                      onChange={(e) => setHasCutoff(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="enableCutoff" className="text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                      Cutoff Time (Optional)
                    </label>
                  </div>
                  {hasCutoff ? (
                    <div className="flex gap-2">
                      <select
                        value={cutoffHour}
                        onChange={(e) => setCutoffHour(e.target.value)}
                        className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-slate-500 self-center font-bold">:</span>
                      <select
                        value={cutoffMin}
                        onChange={(e) => setCutoffMin(e.target.value)}
                        className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={cutoffAmPm}
                        onChange={(e) => setCutoffAmPm(e.target.value)}
                        className="block w-full px-2 sm:px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  ) : (
                    <div className="h-[42px] flex items-center text-xs text-slate-500 italic pl-3.5 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl select-none">
                      Cutoff disabled
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-sm font-semibold hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fallback QR Code Modal */}
      {activeQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-center relative">
            <button
              onClick={() => setActiveQrEvent(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              FALLBACK ATTENDANCE QR
            </span>
            
            <h3 className="text-xl font-black text-slate-100">{activeQrEvent.name}</h3>
            
            <p className="text-xs text-slate-400 mt-1">
              {formatDate(activeQrEvent.event_date)} • {formatTime(activeQrEvent.start_time)}
            </p>

            {/* QR block */}
            <div className="my-8 flex justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={getEventQrUrl(activeQrEvent.event_qr_token)}
                  size={200}
                  level="Q"
                  includeMargin={false}
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-200">Forgot your physical ID card?</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
              Scan this temporary QR code with your phone camera to open the fallback check-in attendance form.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
