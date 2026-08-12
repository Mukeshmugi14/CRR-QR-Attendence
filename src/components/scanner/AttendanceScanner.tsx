'use client';

import { useState, useEffect, useRef } from 'react';
import { processMemberQrScan as scanAction } from '@/app/admin/scanner/actions';
import Link from 'next/link';
import { formatTime, formatDate } from '@/lib/utils';
import { 
  QrCode, 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Volume2,
  RefreshCw,
  Zap,
  CameraOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveEvent {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  attendance_cutoff_time: string | null;
  event_qr_token: string;
  status: string;
  present_count: string;
  total_members: string;
}

interface AttendanceScannerProps {
  initialActiveEvents: any[];
}

export function AttendanceScanner({ initialActiveEvents }: AttendanceScannerProps) {
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>(initialActiveEvents as ActiveEvent[]);
  const [selectedEvent, setSelectedEvent] = useState<ActiveEvent | null>(initialActiveEvents.length === 1 ? initialActiveEvents[0] : null);
  
  // Scanner state
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'duplicate'>('idle');
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);
  
  const qrScannerRef = useRef<any>(null);
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null);
  const audioErrorRef = useRef<HTMLAudioElement | null>(null);

  // Audio initialize for scan feedback
  useEffect(() => {
    // Generate synthetic click/beep sounds so we don't need external audio files!
    const createBeepUrl = (frequency: number, duration: number, type: OscillatorType) => {
      if (typeof window === 'undefined') return null;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Return dummy node playback helper
        return {
          play: () => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = type;
            o.frequency.value = frequency;
            g.gain.setValueAtTime(0.08, ctx.currentTime);
            // Quick decay envelope
            g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + duration);
          }
        };
      } catch {
        return null;
      }
    };

    (window as any).successBeep = createBeepUrl(880, 0.15, 'sine'); // High pitch quick beep
    (window as any).errorBeep = createBeepUrl(220, 0.3, 'sawtooth');  // Low pitch buzz
  }, []);

  const playSuccessSound = () => {
    if ((window as any).successBeep) {
      (window as any).successBeep.play();
    }
  };

  const playErrorSound = () => {
    if ((window as any).errorBeep) {
      (window as any).errorBeep.play();
    }
  };

  // Extract UUID from QR code text
  const extractUuid = (text: string): string | null => {
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = text.match(uuidRegex);
    return match ? match[0] : null;
  };

  // Auto-resume camera scanning loop
  const pauseScanning = (ms: number) => {
    setTimeout(() => {
      setScanStatus('scanning');
      setScanResult(null);
      setLastScanMessage(null);
      setIsScanning(true);
    }, ms);
  };

  // QR Code scanned successfully
  const onScanSuccess = async (decodedText: string) => {
    if (!isScanning) return;
    
    // Extract token UUID
    const qrToken = extractUuid(decodedText);
    if (!qrToken) {
      // Not a valid UUID URL
      setScanStatus('error');
      setLastScanMessage("Invalid QR code format.");
      playErrorSound();
      pauseScanning(2000);
      return;
    }

    setIsScanning(false); // Pause scan triggers
    setScanStatus('idle');

    try {
      // Process scan on server
      const res = await scanAction(qrToken, selectedEvent?.id);

      if (res.success) {
        if (res.alreadyExists) {
          // Already checked in
          setScanStatus('duplicate');
          setScanResult(res);
          playErrorSound();
          pauseScanning(2000);
        } else {
          // Success check-in!
          setScanStatus('success');
          setScanResult(res);
          playSuccessSound();
          
          // Confetti!
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });

          // Refresh live stats
          setSelectedEvent(prev => {
            if (prev) {
              return {
                ...prev,
                present_count: String(Number(prev.present_count) + 1)
              };
            }
            return null;
          });

          pauseScanning(1600);
        }
      } else {
        // Failed check-in (e.g. revoked QR, inactive member)
        setScanStatus('error');
        setLastScanMessage(res.message || "Attendance recording failed.");
        playErrorSound();
        pauseScanning(2500);
      }
    } catch (err: any) {
      setScanStatus('error');
      setLastScanMessage("Network or database connection error.");
      playErrorSound();
      pauseScanning(2500);
    }
  };

  const onScanFailure = (error: any) => {
    // Silently handle ordinary frame scanning failures (QR code not in frame)
  };

  // Start Camera QR Scanner
  useEffect(() => {
    if (!selectedEvent) return;

    let html5QrCode: any;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (width: number, height: number) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          onScanSuccess,
          onScanFailure
        );
        setIsScannerLoaded(true);
        setCameraError(null);
        setScanStatus('scanning');
      } catch (err: any) {
        console.error("Camera start error:", err);
        setCameraError("Could not access environment camera. Please check browser permissions.");
        setIsScannerLoaded(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e: any) => console.error("Error stopping scanner:", e));
      }
    };
  }, [selectedEvent]);

  // Render Screens
  if (activeEvents.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
        <CameraOff className="h-12 w-12 mx-auto text-slate-600 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-100">NO ACTIVE EVENT</h2>
        <p className="text-sm text-slate-400 leading-normal">
          There are no events currently scheduled or active within the check-in window (2 hours before start until 1 hour after cutoff).
        </p>
        <div className="pt-2">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850"
          >
            <RefreshCw className="h-3 w-3" /> Retry Check
          </button>
        </div>
      </div>
    );
  }

  if (activeEvents.length > 1 && !selectedEvent) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wide text-center">MULTIPLE ACTIVE EVENTS</h2>
        <p className="text-xs text-slate-400 text-center mt-1">Please select the event you want to scan attendance for:</p>
        <div className="mt-5 space-y-3">
          {activeEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500 hover:bg-indigo-600/5 transition-all text-left group"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">{evt.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {formatTime(evt.start_time)} - {formatTime(evt.end_time)}
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-400">Select &rarr;</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      {/* Left 2 Cols: Camera scanner view */}
      <div className="lg:col-span-2 space-y-4">
        {selectedEvent && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                🔴 Scan Target: {selectedEvent.name}
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}</span>
                <span>•</span>
                <span>Date: {formatDate(selectedEvent.event_date, false)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-850 shrink-0">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-bold">{selectedEvent.present_count} / {selectedEvent.total_members} Present</span>
            </div>
          </div>
        )}

        {/* Camera container */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl aspect-square sm:aspect-video w-full flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
              <p className="text-sm text-slate-300 font-bold">{cameraError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                Reload Permissions
              </button>
            </div>
          ) : (
            <>
              {/* html5-qrcode reader element */}
              <div id="reader" className="w-full h-full object-cover"></div>

              {/* Laser scanner effect (only visible while scanning) */}
              {scanStatus === 'scanning' && (
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-indigo-500/80 shadow-lg shadow-indigo-500 animate-bounce pointer-events-none" />
              )}

              {/* Status overlays */}
              {scanStatus === 'success' && scanResult && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 mb-4 scale-up">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">SUCCESS</h3>
                  <p className="text-lg font-bold text-slate-200 mt-1">{scanResult.memberName}</p>
                  <p className="text-xs text-indigo-400 uppercase tracking-wider font-extrabold mt-0.5">{scanResult.memberPosition}</p>
                  
                  <div className="mt-5 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-6 justify-center">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Arrival</span>
                      <span className="block text-xs text-slate-300 font-semibold mt-0.5">{scanResult.timingCategory}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Points</span>
                      <span className="block text-sm text-emerald-400 font-black">+{scanResult.score} PTS</span>
                    </div>
                  </div>
                </div>
              )}

              {scanStatus === 'duplicate' && scanResult && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30 mb-4">
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-black text-amber-400 uppercase tracking-tight">ALREADY RECORDED</h3>
                  <p className="text-base font-bold text-slate-200 mt-1">{scanResult.memberName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Scanned at: {formatTime(scanResult.scanTime)}
                  </p>
                  <p className="text-sm font-black text-indigo-400 mt-2">Score: {scanResult.score} PTS</p>
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-full border border-red-500/30 mb-4">
                    <AlertCircle className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-black text-red-400 uppercase tracking-tight">SCAN FAILS</h3>
                  <p className="text-sm text-slate-200 mt-2 font-semibold">{lastScanMessage}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Col: Info / Event config */}
      <div className="space-y-4">
        {selectedEvent && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-250 uppercase tracking-wide">Scanner Instructions</h3>
            
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>1. Present the physical member ID card to the camera preview.</p>
              <p>2. Keep the card aligned with the center box for fast resolution.</p>
              <p>3. Scanning requires an active internet connection to submit checks in real-time.</p>
            </div>

            <div className="border-t border-slate-850 pt-4 space-y-2.5">
              <span className="block text-xs font-bold text-slate-400 uppercase">Live Operations Shortcuts</span>
              <Link
                href={`/admin/leaderboard/event/${selectedEvent.id}`}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 hover:border-slate-800 hover:text-white text-slate-400 text-xs font-semibold transition-all"
              >
                <span>Live Event Leaderboard</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
