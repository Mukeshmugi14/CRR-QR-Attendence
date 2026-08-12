import { createClient } from '@/lib/supabase/server';
import { EventsList } from '@/components/events/EventsList';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-indigo-400" />
            Club Events & Meetings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and schedule events, configure scoring templates, display fallback event QRs, and manage check-ins.
          </p>
        </div>
      </div>

      <EventsList initialEvents={events || []} />
    </div>
  );
}
