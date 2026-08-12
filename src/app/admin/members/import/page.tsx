'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importClubMembers } from './actions';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Loader2,
  Table
} from 'lucide-react';
import Link from 'next/link';

interface ParsedRecord {
  full_name: string;
  position: string;
  email?: string | null;
  phone?: string | null;
  member_code?: string | null;
}

export default function ExcelImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation stats
  const [totalRows, setTotalRows] = useState(0);
  const [validRecords, setValidRecords] = useState<ParsedRecord[]>([]);
  const [invalidRows, setInvalidRows] = useState<{ row: number; reason: string; data: any }[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setParsedData([]);
    setValidRecords([]);
    setInvalidRows([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rawJson.length < 2) {
          throw new Error("Excel sheet seems empty or missing header row.");
        }

        // Parse Headers
        const headers = rawJson[0].map((h: any) => String(h).trim().toUpperCase());
        
        // Find column indexes
        const nameIdx = headers.findIndex((h: string) => h.includes('NAME') || h.includes('MEMBER'));
        const posIdx = headers.findIndex((h: string) => h.includes('POSITION') || h.includes('ROLE'));
        const codeIdx = headers.findIndex((h: string) => h.includes('CODE') || h.includes('ID'));
        const emailIdx = headers.findIndex((h: string) => h.includes('EMAIL'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('PHONE') || h.includes('CONTACT'));

        if (nameIdx === -1) {
          throw new Error("Could not find a 'Name' column in Excel. Columns found: " + headers.join(', '));
        }
        if (posIdx === -1) {
          throw new Error("Could not find a 'Position' column in Excel. Columns found: " + headers.join(', '));
        }

        const valid: ParsedRecord[] = [];
        const invalid: { row: number; reason: string; data: any }[] = [];

        // Parse data rows
        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue; // Skip empty rows

          const nameVal = row[nameIdx] ? String(row[nameIdx]).trim() : '';
          const posVal = row[posIdx] ? String(row[posIdx]).trim() : '';
          const codeVal = codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : null;
          const emailVal = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : null;
          const phoneVal = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : null;

          if (!nameVal && !posVal) {
            continue; // Skip completely empty row
          }

          if (!nameVal) {
            invalid.push({ row: i + 1, reason: "Name is empty", data: row });
          } else if (!posVal) {
            invalid.push({ row: i + 1, reason: "Position is empty", data: row });
          } else {
            valid.push({
              full_name: nameVal,
              position: posVal,
              email: emailVal,
              phone: phoneVal,
              member_code: codeVal
            });
          }
        }

        setTotalRows(rawJson.length - 1);
        setValidRecords(valid);
        setInvalidRows(invalid);
        setParsedData(valid);
      } catch (err: any) {
        setError(err.message || "Failed to parse Excel file.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (validRecords.length === 0) return;
    setImporting(true);
    setError(null);

    try {
      const res = await importClubMembers(validRecords);
      if (res.success) {
        setImportResult({
          imported: res.imported || 0,
          skipped: res.skippedDuplicates || 0
        });
        // Redirect back after delay
        setTimeout(() => {
          router.push('/admin/members');
          router.refresh();
        }, 3000);
      } else {
        setError(res.error || "Failed to import members.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <Link
          href="/admin/members"
          className="p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
            Import Members from Excel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload an Excel (.xlsx, .xls) or CSV spreadsheet to populate the member list.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {importResult && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="h-5 w-5" />
            Import Completed Successfully!
          </div>
          <p className="text-sm text-emerald-400/90 pl-7">
            Successfully imported {importResult.imported} members. {importResult.skipped} duplicate records were skipped.
          </p>
          <p className="text-xs text-slate-400 pl-7 pt-1 animate-pulse">Redirecting to members directory...</p>
        </div>
      )}

      {/* Upload Box */}
      {!importResult && (
        <div 
          onClick={triggerSelectFile}
          className="p-10 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-900/35 hover:bg-slate-900/50 transition-all text-center cursor-pointer group flex flex-col items-center justify-center gap-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <div className="p-4 rounded-full bg-slate-950/60 border border-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200 group-hover:text-white">
              {fileName ? fileName : 'Click to select or drag Excel file here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Accepts Excel (.xlsx, .xls) and CSV files</p>
          </div>
          
          <div className="max-w-md text-[11px] text-slate-500 leading-normal border-t border-slate-800/80 pt-4 mt-2">
            <span className="font-semibold text-slate-400">File requirements:</span> Must contain columns matching <code className="text-slate-400">Name</code> and <code className="text-slate-400">Position</code>. Optional columns: <code className="text-slate-400">Code</code>, <code className="text-slate-400">Email</code>, and <code className="text-slate-400">Phone</code>.
          </div>
        </div>
      )}

      {/* Stats Preview & Table */}
      {parsedData.length > 0 && !importResult && (
        <div className="space-y-6">
          {/* Analysis Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xs font-bold text-slate-400 uppercase">Total Rows Read</span>
              <span className="block text-2xl font-black text-slate-200 mt-1">{totalRows}</span>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xs font-bold text-emerald-400 uppercase">Valid Records</span>
              <span className="block text-2xl font-black text-emerald-400 mt-1">{validRecords.length}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xs font-bold text-amber-400 uppercase font-semibold">Missing Name/Position</span>
              <span className="block text-2xl font-black text-amber-400 mt-1">{invalidRows.length}</span>
            </div>
          </div>

          {/* Invalid Rows alert */}
          {invalidRows.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <Info className="h-4 w-4" />
                Rows Skipped During Parse:
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {invalidRows.slice(0, 5).map((row, idx) => (
                  <li key={idx}>Row {row.row}: {row.reason}</li>
                ))}
                {invalidRows.length > 5 && <li>...and {invalidRows.length - 5} more rows.</li>}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              onClick={() => {
                setParsedData([]);
                setFileName(null);
                setValidRecords([]);
                setInvalidRows([]);
              }}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-all"
            >
              Clear Upload
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={importing || validRecords.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing Members...
                </>
              ) : (
                `Confirm & Import ${validRecords.length} Members`
              )}
            </button>
          </div>

          {/* Table Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <Table className="h-4 w-4 text-indigo-400" />
              Import Preview (First Sheet)
            </h3>
            
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider sticky top-0 bg-slate-900 z-10">
                    <th className="py-2.5 px-3">Code (Import)</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Club Position</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {validRecords.map((m, idx) => (
                    <tr key={idx} className="border-b border-slate-850 hover:bg-slate-850/5 text-slate-400">
                      <td className="py-2 px-3 font-mono text-slate-500">{m.member_code || 'Auto Generate'}</td>
                      <td className="py-2 px-3 font-bold text-slate-300">{m.full_name}</td>
                      <td className="py-2 px-3 text-indigo-400">{m.position}</td>
                      <td className="py-2 px-3">{m.email || '—'}</td>
                      <td className="py-2 px-3">{m.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
