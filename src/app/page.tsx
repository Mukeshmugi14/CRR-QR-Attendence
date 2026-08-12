import Link from 'next/link';
import { 
  QrCode, 
  ShieldCheck, 
  Award, 
  Users, 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Calendar,
  Layers,
  Lock
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300" />
              <img src="/logo.png" className="relative h-11 w-11 rounded-full object-cover border border-slate-800" alt="CRR Logo" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base tracking-wider text-slate-100 uppercase">
                CRR-Attendence
              </span>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest -mt-0.5">
                Chennai Radiance Raisers
              </span>
            </div>
          </div>
          <div>
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center py-2.5 px-6 rounded-xl font-bold text-sm text-white group overflow-hidden transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl" />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-1.5">
                Dashboard Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center pt-16 pb-20 relative z-10">
        
        {/* Top Feature Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-8 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Operational Attendance Hub</span>
        </div>

        {/* Brand Image Wrapper with Glow */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition duration-500 animate-bounce" style={{ animationDuration: '6s' }} />
          <img 
            src="/logo.png" 
            className="relative h-40 w-40 rounded-full object-cover border-4 border-slate-900 shadow-2xl shadow-indigo-500/10 scale-100 group-hover:scale-105 transition-transform duration-500" 
            alt="CRR Logo" 
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-center max-w-4xl leading-none">
          Chennai Radiance Raisers <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CRR-Attendence System
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 text-center max-w-2xl mx-auto mt-6 leading-relaxed">
          The official internal operations portal. Scan member cards, record live attendance, track punctuality scoring, and review dynamic leaderboards instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full max-w-md justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all active:scale-98"
          >
            Access Admin System
          </Link>
          <a
            href="#features"
            className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white transition-all active:scale-98"
          >
            Explore Features
          </a>
        </div>

        {/* Key Metrics / Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 w-full max-w-5xl border-y border-slate-900 py-10 bg-slate-950/40 backdrop-blur-sm rounded-2xl px-6">
          <div className="text-center">
            <span className="block text-3xl sm:text-4xl font-extrabold text-slate-100">100%</span>
            <span className="block text-[10px] sm:text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1.5">Secure QR Signatures</span>
          </div>
          <div className="text-center border-l border-slate-900">
            <span className="block text-3xl sm:text-4xl font-extrabold text-slate-100">Instant</span>
            <span className="block text-[10px] sm:text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1.5">Check-In Resolving</span>
          </div>
          <div className="text-center border-l border-slate-900">
            <span className="block text-3xl sm:text-4xl font-extrabold text-slate-100">Auto</span>
            <span className="block text-[10px] sm:text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1.5">Leaderboard Tracking</span>
          </div>
          <div className="text-center border-l border-slate-900">
            <span className="block text-3xl sm:text-4xl font-extrabold text-slate-100">PDF</span>
            <span className="block text-[10px] sm:text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1.5">Batch Card Exports</span>
          </div>
        </div>

        {/* Feature Sections Grid */}
        <section id="features" className="w-full mt-24 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">System Core Capabilities</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">Engineered to streamline tracking, scoring, and analysis for all club events.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-indigo-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-5 border border-indigo-500/15">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">QR Card Resolution</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Scan permanent member cards using the device camera. The system reads individual secure tokens to record attendance instantly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-purple-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-5 border border-purple-500/15">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">Punctuality Scoring</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Check-ins are scored dynamically based on member arrival time (Early, On-Time, Late, or Absent), encouraging active participation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-pink-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 mb-5 border border-pink-500/15">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">Leaderboards</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Generate dynamic leaderboards showing monthly and all-time scores. Display positions and active participation stats on screen.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-emerald-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-5 border border-emerald-500/15">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">Card Generator</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Generate, style, and download print-ready individual ID card PDFs, or batch download the entire roster layout in a single click.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-amber-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5 border border-amber-500/15">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">PDF Roster Reports</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Export comprehensive event reports directly as PDFs, formatted with Rotaract branding headers and complete statistics.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-blue-500/30 transition-all hover:bg-slate-900/60 duration-300">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-5 border border-blue-500/15">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">Secure Lockdown</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Access is limited strictly to database accounts provisioned with designated President or Sergeant roles, preventing leaks.
              </p>
            </div>

          </div>
        </section>

        {/* Timeline Workflow */}
        <section className="w-full mt-28 border-t border-slate-900 pt-20">
          <div className="text-center space-y-2 mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">Operational Workflow</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">How our attendance check-in resolves from registration to points logging.</p>
          </div>

          <div className="relative border-l border-slate-800 ml-4 md:ml-32 space-y-12">
            
            {/* Step 1 */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-3 top-1.5 h-6 w-6 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center z-10">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
              </div>
              <span className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">Step 01</span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">ID Generation & Distribution</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Admins upload members, generating a secure hash token mapped to each identity. These cards are printed in CR80 standard formats containing distinct check-in QR signatures.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-3 top-1.5 h-6 w-6 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center z-10">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
              </div>
              <span className="block text-xs font-bold text-purple-400 uppercase tracking-widest">Step 02</span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">Event Startup & Cutoff Setup</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                The President or Sergeant sets up the active event, establishing the timing criteria (Start, End, and optional Attendance Cutoff) with our AM/PM time configurations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-3 top-1.5 h-6 w-6 rounded-full bg-slate-950 border-2 border-pink-500 flex items-center justify-center z-10">
                <div className="h-2 w-2 rounded-full bg-pink-500" />
              </div>
              <span className="block text-xs font-bold text-pink-400 uppercase tracking-widest">Step 03</span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">Environmental QR Scanning</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                As members arrive, their ID cards are presented to the Admin camera scanner. In the event a card is missing, the member scans the fallback QR to submit a self check-in on their device.
              </p>
            </div>

          </div>
        </section>

        {/* Bottom security footer box */}
        <div className="pt-24 w-full">
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-center flex items-center gap-3 justify-center text-xs text-slate-500">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
            <span>Encrypted data structures powered by Supabase Auth and Vercel hosting. Authorized access only.</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} CRR-Attendence System. All rights reserved.</span>
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Rotaract Club of Chennai Radiance Raisers</span>
        </div>
      </footer>

    </div>
  );
}
