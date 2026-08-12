'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

export function MonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current parameter values or fall back to today
  const now = new Date();
  const currentMonth = Number(searchParams.get('month')) || (now.getMonth() + 1);
  const currentYear = Number(searchParams.get('year')) || now.getFullYear();

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

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const handleMonthChange = (month: number) => {
    router.push(`/admin/leaderboard/monthly?month=${month}&year=${currentYear}`);
  };

  const handleYearChange = (year: number) => {
    router.push(`/admin/leaderboard/monthly?month=${currentMonth}&year=${year}`);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 w-full sm:w-auto sm:shrink-0">
      <Calendar className="h-4.5 w-4.5 text-indigo-400 shrink-0" />

      <select
        value={currentMonth}
        onChange={(e) => handleMonthChange(Number(e.target.value))}
        className="flex-1 sm:flex-none min-w-0 bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200">
            {m.label}
          </option>
        ))}
      </select>

      <select
        value={currentYear}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="shrink-0 bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y} className="bg-slate-900 text-slate-200">
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
