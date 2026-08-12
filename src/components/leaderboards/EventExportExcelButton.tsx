'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchEventAttendance } from '@/app/admin/events/actions';

interface EventExportExcelButtonProps {
  eventId: string;
  eventName: string;
  className?: string;
  variant?: 'compact' | 'full';
}

export function EventExportExcelButton({
  eventId,
  eventName,
  className = '',
  variant = 'full'
}: EventExportExcelButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetchEventAttendance(eventId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch attendance data.');
      }

      const data = res.data;
      if (!data || data.length === 0) {
        alert('No attendance records found for this event.');
        setExporting(false);
        return;
      }

      // Format the data for Excel sheet
      const formattedData = data.map((row: any) => ({
        'Rank': row.rank,
        'Member Code': row.member_code || '-',
        'Full Name': row.full_name,
        'Position': row.position || '-',
        'Points Gained': row.score,
        'Scan Time': row.scanned_at ? new Date(row.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-',
        'Scan Date': row.scanned_at ? new Date(row.scanned_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        'Method': row.attendance_method === 'id_card_scan' ? 'ID Card Scan' : 'Self Check-in',
        'Punctuality': row.timing_category || '-',
        'Minutes Offset': row.minutes_from_start !== undefined 
          ? (row.minutes_from_start < 0 
             ? `${Math.abs(row.minutes_from_start)} min early` 
             : `${row.minutes_from_start} min late`)
          : '-',
        'Scanned By': row.scanned_by_name || 'Self Check-in'
      }));

      // Create spreadsheet
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-fit column widths
      const colWidths = Object.keys(formattedData[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...formattedData.map((row: any) => String(row[key] || '').length)
        );
        return { wch: maxLength + 2 };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Standings');

      // Write to Excel and trigger download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      
      const cleanEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${cleanEventName}_attendance_${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during export.');
      alert(err.message || 'An error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleExport}
        disabled={exporting}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50 ${className}`}
        title="Export to Excel"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>Export</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 px-4 py-2.5 text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:hover:text-emerald-400 ${className}`}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 shrink-0" />
      )}
      <span>Export Excel</span>
    </button>
  );
}
