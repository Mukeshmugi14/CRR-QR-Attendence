'use client';

import { useState } from 'react';
import { fetchReportData } from '@/app/admin/reports/actions';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Table, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  Trophy, 
  AlertCircle 
} from 'lucide-react';

export function ReportsManager() {
  const [reportType, setReportType] = useState<'monthly' | 'alltime'>('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Generate CSV File
  const handleExportCsv = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReportData(reportType, month, year);
      if (!res.success) throw new Error(res.error || 'Failed to fetch data.');

      const data = res.data;
      if (data.length === 0) {
        setError('No data records found for this period.');
        setLoading(false);
        return;
      }

      // Compile CSV contents
      let csvHeaders = '';
      let csvRows: string[] = [];

      if (reportType === 'monthly') {
        csvHeaders = 'Rank,Member Code,Full Name,Position,Events Attended,Average Score,Attendance Percentage,Total Points';
        csvRows = data.map((r: any) => 
          `"${r.rank}","${r.member_code}","${r.full_name}","${r.position}","${r.events_attended}","${r.average_score}","${r.attendance_percentage}%","${r.total_points}"`
        );
      } else {
        csvHeaders = 'Rank,Member Code,Full Name,Position,Events Attended,Average Score,Best Score,Attendance Percentage,Total Points';
        csvRows = data.map((r: any) => 
          `"${r.rank}","${r.member_code}","${r.full_name}","${r.position}","${r.events_attended}","${r.average_score}","${r.best_event_score}","${r.attendance_percentage}%","${r.total_points}"`
        );
      }

      const csvString = [csvHeaders, ...csvRows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const filename = reportType === 'monthly' 
        ? `Monthly_Leaderboard_${month}_${year}.csv`
        : `All_Time_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`;
        
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'An error occurred during CSV export.');
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF Report Document
  const handleExportPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReportData(reportType, month, year);
      if (!res.success) throw new Error(res.error || 'Failed to fetch data.');

      const data = res.data;
      if (data.length === 0) {
        setError('No data records found for this period.');
        setLoading(false);
        return;
      }

      // Initialize PDF document (A4 size: 210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const todayStr = new Date().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
      const periodStr = reportType === 'monthly' 
        ? `${res.meta?.monthName} ${year}` 
        : 'All-Time';

      // 1. Draw Page Header Borders & Background
      doc.setFillColor(30, 41, 59); // Dark blue / slate title background
      doc.rect(15, 15, 180, 24, 'F');

      // 2. Title Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ROTARACT CLUB INTERNAL PERFORMANCE REPORT', 105, 24, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Period: ${periodStr} • Generated on: ${todayStr}`, 105, 30, { align: 'center' });

      // 3. Metadata Section
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('EXECUTIVE OVERVIEW', 15, 48);

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(15, 50, 195, 50);

      // Meta Stats Cards boxes
      doc.setFillColor(248, 250, 252); // grey-50
      doc.rect(15, 54, 55, 18, 'F');
      doc.rect(77, 54, 55, 18, 'F');
      doc.rect(140, 54, 55, 18, 'F');

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(8);
      doc.text('REPORT TYPE', 18, 59);
      doc.text('TOTAL MEMBERS', 80, 59);
      doc.text('TOTAL EVENTS', 143, 59);

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(reportType === 'monthly' ? 'Monthly Leader' : 'All-Time', 18, 65);
      doc.text(String(data.length), 80, 65);
      doc.text(reportType === 'monthly' ? String(res.meta?.totalEvents || 0) : 'All', 143, 65);

      // Top 3 Highlights Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOP 3 CLUB PERFORMERS', 15, 82);
      doc.line(15, 84, 195, 84);

      const top3 = data.slice(0, 3);
      doc.setFillColor(239, 246, 255); // light indigo background for podium
      doc.rect(15, 88, 180, 15, 'F');

      doc.setTextColor(79, 70, 229); // Indigo
      doc.setFontSize(9);
      
      let top3Text = '';
      if (top3.length > 0) {
        top3Text += `1st: ${top3[0].full_name} (${top3[0].total_points} pts)`;
      }
      if (top3.length > 1) {
        top3Text += `   |   2nd: ${top3[1].full_name} (${top3[1].total_points} pts)`;
      }
      if (top3.length > 2) {
        top3Text += `   |   3rd: ${top3[2].full_name} (${top3[2].total_points} pts)`;
      }
      doc.text(top3Text || 'No performers recorded.', 105, 97, { align: 'center' });

      // 4. Standings Table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LEADERBOARD STANDINGS', 15, 114);
      doc.line(15, 116, 195, 116);

      // Draw table headers
      doc.setFillColor(15, 23, 42);
      doc.rect(15, 120, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Rank', 18, 125);
      doc.text('Code', 30, 125);
      doc.text('Name', 48, 125);
      doc.text('Position', 90, 125);
      doc.text('Attended', 135, 125);
      doc.text('Avg', 155, 125);
      doc.text('Rate %', 170, 125);
      doc.text('Points', 185, 125);

      // Draw table rows
      let currentY = 128;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Check page cutoff to support page breaks if needed
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
          
          // Draw table headers on new page
          doc.setFillColor(15, 23, 42);
          doc.rect(15, currentY, 180, 8, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('Rank', 18, currentY + 5);
          doc.text('Code', 30, currentY + 5);
          doc.text('Name', 48, currentY + 5);
          doc.text('Position', 90, currentY + 5);
          doc.text('Attended', 135, currentY + 5);
          doc.text('Avg', 155, currentY + 5);
          doc.text('Rate %', 170, currentY + 5);
          doc.text('Points', 185, currentY + 5);
          
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'normal');
          currentY += 11;
        }

        // Alternate row colors
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY - 3, 180, 6, 'F');
        }

        doc.setFont('helvetica', row.rank <= 3 ? 'bold' : 'normal');
        doc.text(String(row.rank), 18, currentY);
        doc.setFont('courier', 'bold');
        doc.text(String(row.member_code), 30, currentY);
        doc.setFont('helvetica', row.rank <= 3 ? 'bold' : 'normal');
        
        // Truncate name if it exceeds page constraints
        let name = String(row.full_name);
        if (name.length > 20) name = name.substring(0, 18) + '..';
        doc.text(name, 48, currentY);

        let pos = String(row.position);
        if (pos.length > 24) pos = pos.substring(0, 22) + '..';
        doc.text(pos, 90, currentY);

        doc.text(String(row.events_attended), 140, currentY, { align: 'center' });
        doc.text(String(row.average_score), 158, currentY, { align: 'center' });
        doc.text(`${row.attendance_percentage}%`, 175, currentY, { align: 'center' });
        doc.text(String(row.total_points), 188, currentY, { align: 'center' });

        currentY += 6.5; // row height
      }

      // 5. Draw Footer (Page numbers, secure warning)
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 282, 195, 282);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('CRR-Attendence System. Confidential - Internal Circulation Only.', 15, 287);
        doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
      }

      const pdfFilename = reportType === 'monthly' 
        ? `Monthly_Report_${month}_${year}.pdf`
        : `All_Time_Report.pdf`;

      doc.save(pdfFilename);
    } catch (err: any) {
      setError(err.message || 'An error occurred during PDF export.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings Panel */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Report Parameters</h3>
        
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'monthly' | 'alltime')}
              className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="monthly">Monthly Leaderboard Standings</option>
              <option value="alltime">All-Time Cumulative Leaderboard</option>
            </select>
          </div>

          {/* Month/Year selectors (Only if Monthly is active) */}
          {reportType === 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action triggers */}
        <div className="pt-4 border-t border-slate-850 space-y-3">
          <button
            onClick={handleExportPdf}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Compile PDF Report
          </button>
          
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-850 text-slate-400 hover:text-white font-semibold text-sm transition-all active:scale-98 disabled:opacity-50"
          >
            <Table className="h-4 w-4 text-slate-500" />
            Export CSV File
          </button>
        </div>
      </div>

      {/* Guide / Preview Box */}
      <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" /> Document Preview Guidelines
          </h3>
          
          <div className="text-xs text-slate-400 leading-relaxed space-y-3">
            <p><strong>Configured Document Templates:</strong></p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-350">Confidential Layout:</strong> Employs margins, clean titles, headers, and footer notes confirming it is confidential and intended for internal club circulation only.
              </li>
              <li>
                <strong className="text-slate-350">Security Filters:</strong> Automatically filters out and excludes database UUID tokens, personal phone numbers, emails, check-in signatures, and credentials.
              </li>
              <li>
                <strong className="text-slate-350">Podium Summaries:</strong> Generates a highlighted podium band highlighting the top 3 members by score.
              </li>
              <li>
                <strong className="text-slate-350">Page-breaks:</strong> Automatically wraps and draws new pages if members list exceeds the standard portrait page height limit.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <p className="text-[11px] text-slate-500 leading-normal">
            Generate and share performance reports in club channels (WhatsApp, Telegram) to keep members updated and motivated.
          </p>
        </div>
      </div>
    </div>
  );
}
