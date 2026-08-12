'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // SVG is cleaner for screen preview
import { jsPDF } from 'jspdf';
import { 
  CreditCard, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Check,
  User,
  Image as ImageIcon
} from 'lucide-react';

interface Member {
  id: string;
  member_code: string;
  full_name: string;
  position: string;
  email: string | null;
  phone: string | null;
  member_qr_token: string;
  qr_status: string;
  is_active: boolean;
}

interface IdCardGeneratorProps {
  members: Member[];
  stats: {
    total: number;
    qrGenerated: number;
    qrRevoked: number;
  };
  initialSelectedId?: string;
}

export function IdCardGenerator({ members, stats, initialSelectedId }: IdCardGeneratorProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [appUrl, setAppUrl] = useState('');
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Convert logo.png to base64 for jsPDF use
    const loadLogo = async () => {
      try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Failed to load logo as base64', err);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    // Set public app URL with fallback to current window location
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const configUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    setAppUrl(configUrl);

    // Set initial selected member
    if (initialSelectedId && members.length > 0) {
      const match = members.find(m => m.id === initialSelectedId);
      if (match) setSelectedMember(match);
    } else if (members.length > 0) {
      setSelectedMember(members[0]);
    }
  }, [initialSelectedId, members]);

  const getQrUrl = (token: string) => {
    return `${appUrl}/m/${token}`;
  };

  const handleNext = () => {
    if (!selectedMember || members.length <= 1) return;
    const currentIdx = members.findIndex(m => m.id === selectedMember.id);
    const nextIdx = (currentIdx + 1) % members.length;
    setSelectedMember(members[nextIdx]);
  };

  const handlePrev = () => {
    if (!selectedMember || members.length <= 1) return;
    const currentIdx = members.findIndex(m => m.id === selectedMember.id);
    const prevIdx = (currentIdx - 1 + members.length) % members.length;
    setSelectedMember(members[prevIdx]);
  };

  // Helper to generate canvas QR code for jsPDF export
  const getQrBase64 = async (qrUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      
      // Use qr-code generator library dynamically or render it to a temporary canvas using Image
      // A quick offscreen SVG to Image render:
      const svgElement = qrCanvasRef.current?.querySelector('svg');
      if (!svgElement) {
        resolve('');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(image, 10, 10, 280, 280);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(blobURL);
        resolve(dataUrl);
      };
      image.src = blobURL;
    });
  };

  // Generate Single Card PDF
  const downloadSinglePdf = async (member: Member) => {
    try {
      const qrUrl = getQrUrl(member.member_qr_token);
      const qrDataUrl = await getQrBase64(qrUrl);
      
      // jsPDF instance
      // CR80 ID Card dimensions: 54mm width, 86mm height, portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });

      renderCardToPdfPage(doc, member, qrDataUrl, 0);
      doc.save(`${member.member_code}_${member.full_name.replace(/\s+/g, '_')}_ID.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Check logs.');
    }
  };

  // Generate All ID Cards PDF
  const downloadAllPdf = async () => {
    if (members.length === 0) return;
    setDownloadingAll(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (i > 0) {
          doc.addPage([54, 86], 'portrait');
        }
        
        const qrUrl = getQrUrl(member.member_qr_token);
        // We temporarily update selection to trigger SVG generation or wait
        // Since getQrBase64 reads from the DOM SVG element, we can generate base64 using a canvas directly or temporarily render it.
        // A safer way is to draw the QR code on a canvas programmatically in JS!
        // Let's implement programmatically drawing the QR code to canvas or using an offscreen renderer.
        // To draw programmatically, we can create a temporary element or use the helper:
        const qrDataUrl = await generateOffscreenQrDataUrl(qrUrl);
        renderCardToPdfPage(doc, member, qrDataUrl, i);
      }

      doc.save(`All_Members_ID_Cards.pdf`);
    } catch (err) {
      console.error('Error generating all PDFs:', err);
      alert('Failed to generate batch PDF.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // Generate Programmatic QR Code on Canvas
  const generateOffscreenQrDataUrl = async (text: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      // Simple rendering using a canvas text fallback or image element.
      // Since selectedMember state can be set, let's render the selected SVG offscreen.
      // Let's create an offscreen container to render QRCodeSVG and fetch it:
      const div = document.createElement('div');
      div.style.display = 'none';
      document.body.appendChild(div);
      
      // Let's render the SVG content into image
      // To bypass React render cycle, we can just load the canvas image from Google/Chart APIs or draw manually.
      // Wait, Google charts is simple but requires internet! Let's generate it locally.
      // The easiest way is to use window.document rendering:
      // Let's reuse getQrBase64 but render the QR code in our DOM container.
      // SinceSelectedMember might be different, let's render the QR into an offscreen element.
      // We can generate QR using canvas by utilizing the `qrcode.react` package.
      // Instead of SVG, we can use a temporary hidden canvas. Let's do that!
      const img = new Image();
      // Use qr-code chart API as a solid fallback, or we can simply use the selected member's QR rendered SVG.
      // Let's generate it by rendering a QR in a hidden element or standard API:
      const qrChartUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 10, 10, 280, 280);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        // Fallback if offline
        resolve('');
      };
      img.src = qrChartUrl;
    });
  };

  // PDF Page Layout Renderer
  const renderCardToPdfPage = (doc: jsPDF, member: Member, qrDataUrl: string, index: number) => {
    // Colors
    const primaryColor = [15, 23, 42]; // Slate-900
    const accentColor = [79, 70, 229];  // Indigo-600
    const goldColor = [217, 119, 6];     // Gold/Amber
    
    // Draw background
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.rect(0, 0, 54, 86, 'F');
    
    // Top Indigo banner
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 54, 18, 'F');
    
    // Banner white line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(0, 18, 54, 18);
    
    // Banner Logo & Text
    if (logoBase64) {
      // Draw circular logo image (centered in banner)
      // Banner is from y=0 to y=18
      // Draw logo at x=23.5, y=1.5, w=7, h=7
      doc.addImage(logoBase64, 'PNG', 23.5, 1.5, 7, 7);
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.text('CHENNAI RADIANCE RAISERS', 27, 11.5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.8);
      doc.text('MEMBER IDENTIFICATION', 27, 14.5, { align: 'center' });
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ROTARACT CLUB', 27, 8, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.text('MEMBER IDENTIFICATION', 27, 12, { align: 'center' });
    }

    // Draw Photo Placeholder (Circle outline)
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.ellipse(27, 32, 10, 10, 'FD');
    
    // Avatar text in placeholder
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('PHOTO', 27, 33, { align: 'center' });
    
    // Member Name (Centered, Bold, White)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const nameText = member.full_name.toUpperCase();
    // Wrap text if name is too long
    if (nameText.length > 18) {
      doc.setFontSize(6.5);
    }
    doc.text(nameText, 27, 48, { align: 'center' });

    // Position (Gold/Amber, Semibold)
    doc.setTextColor(251, 191, 36); // gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    const posText = member.position.toUpperCase();
    if (posText.length > 20) {
      doc.setFontSize(4.5);
    }
    doc.text(posText, 27, 52, { align: 'center' });

    // Member Code
    doc.setTextColor(148, 163, 184);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(member.member_code, 27, 57, { align: 'center' });

    // Draw QR Code
    if (qrDataUrl) {
      doc.setFillColor(255, 255, 255);
      doc.rect(14.5, 60, 25, 25, 'F');
      doc.addImage(qrDataUrl, 'PNG', 15.5, 61, 23, 23);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(14.5, 60, 25, 25, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(6);
      doc.text('NO QR CODE', 27, 72, { align: 'center' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Mini Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Active Members</span>
          <span className="block text-2xl font-black text-slate-200 mt-1">{stats.total}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-emerald-400 font-bold uppercase">QR Codes Active</span>
          <span className="block text-2xl font-black text-emerald-400 mt-1">{stats.qrGenerated}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-red-400 font-bold uppercase">QR Codes Revoked</span>
          <span className="block text-2xl font-black text-red-400 mt-1">{stats.qrRevoked}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Selector */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[520px]">
          <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wide">Select Member</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedMember?.id === m.id
                    ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                    : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{m.full_name}</p>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{m.position}</p>
                </div>
                <span className="font-mono text-[10px] font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-slate-400">
                  {m.member_code}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Col: Visual Card Preview */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
          {selectedMember ? (
            <div className="w-full max-w-sm flex flex-col items-center gap-6">
              {/* Card Controls */}
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-400">
                  Card {members.findIndex(m => m.id === selectedMember.id) + 1} of {members.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 active:scale-95 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* ID Card Visual (CR80 ratio: 54x86, scaled up to 300x478) */}
              <div 
                id="printable-id-card"
                className="w-[280px] h-[445px] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative flex flex-col overflow-hidden select-none"
              >
                {/* Header Banner */}
                <div className="h-[95px] bg-indigo-600 flex flex-col items-center justify-center px-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700" />
                  <div className="relative z-10 flex flex-col items-center">
                    <img src="/logo.png" className="h-9 w-9 rounded-full object-cover border border-white/20 mb-1" alt="Logo" />
                    <span className="block text-[9px] font-extrabold tracking-wider uppercase text-white font-sans">
                      CHENNAI RADIANCE RAISERS
                    </span>
                    <span className="block text-[7px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">
                      MEMBER ID PROFILE
                    </span>
                  </div>
                  {/* Banner Divider */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20" />
                </div>

                {/* Avatar Placeholder */}
                <div className="mt-8 flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex flex-col items-center justify-center text-slate-500 shadow-lg">
                    <User className="h-10 w-10 text-slate-500" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 mt-1">Photo</span>
                  </div>
                </div>

                {/* Info Block */}
                <div className="mt-5 text-center px-4 space-y-1">
                  <h4 className="text-base font-black text-slate-100 uppercase tracking-tight truncate">
                    {selectedMember.full_name}
                  </h4>
                  <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide truncate">
                    {selectedMember.position}
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-500 pt-1">
                    {selectedMember.member_code}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="mt-auto mb-6 flex justify-center">
                  <div ref={qrCanvasRef} className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
                    <QRCodeSVG
                      value={getQrUrl(selectedMember.member_qr_token)}
                      size={90}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full border-t border-slate-800/80 pt-5">
                <button
                  onClick={() => downloadSinglePdf(selectedMember)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:text-white text-slate-300 font-semibold text-sm transition-all active:scale-95"
                >
                  <Download className="h-4 w-4 text-slate-400" />
                  PDF Card
                </button>
                <button
                  onClick={downloadAllPdf}
                  disabled={downloadingAll}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {downloadingAll ? 'Building All...' : 'Download All'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              Please upload members first to generate ID cards.
            </div>
          )}
        </div>
      </div>

      {/* Hidden print container styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card, #printable-id-card * {
            visibility: visible;
          }
          #printable-id-card {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            width: 54mm;
            height: 86mm;
          }
        }
      `}</style>
    </div>
  );
}
