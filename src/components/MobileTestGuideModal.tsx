import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Terminal,
  ArrowRight,
  Download,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

interface MobileTestGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
  userEmail: string;
}

export const MobileTestGuideModal: React.FC<MobileTestGuideModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'apk'>('qr');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (sharedUrl) {
      QRCode.toDataURL(sharedUrl, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [sharedUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCreds = () => {
    navigator.clipboard.writeText(`Email: ${userEmail}\nPassword: password123`);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Run SAMS on Your Mobile Device
              </h2>
              <p className="text-xs text-slate-400">
                Test with your account: <span className="text-blue-400 font-mono font-semibold">{userEmail}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-950/60 px-5 sm:px-6 pt-3 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'qr'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Instant Mobile Web / PWA (Instant)</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'apk'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Native Flutter Android APK</span>
          </button>
        </div>

        {/* Tab 1: Instant Mobile Web & PWA via QR */}
        {activeTab === 'qr' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Top QR & URL Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-slate-700/50">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="SAMS Mobile QR Code"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-2">
                  Scan with your phone's camera
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> No App Store install required
                </div>

                <h3 className="text-sm font-extrabold text-white">
                  Step 1: Open on Your Smartphone
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open the Camera on your iPhone or Android and scan the QR code, or paste this URL into Chrome or Safari:
                </p>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-blue-300 truncate">
                    {sharedUrl}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Add to Home screen tip */}
                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <strong className="text-slate-200">Tip (Install as PWA):</strong> In Safari tap <span className="font-semibold text-white">Share → Add to Home Screen</span>. In Chrome tap <span className="font-semibold text-white">⋮ → Install App</span> for a full-screen mobile app experience!
                </div>
              </div>
            </div>

            {/* Step 2: Testing with your Account */}
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-950 p-4 sm:p-5 rounded-2xl border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    Step 2: Sign In with Your Account
                  </h3>
                </div>
                <button
                  onClick={handleCopyCreds}
                  className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedCreds ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Your Pre-Configured Email
                  </span>
                  <div className="text-sm font-mono font-bold text-blue-300 mt-0.5">
                    {userEmail}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Password: <code className="text-slate-300">password123</code> (or any 8+ chars)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Available Roles to Test
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-blue-900/80 text-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      Teacher
                    </span>
                    <span className="bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      Student
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Tap the 1-click preset on the Login screen, or toggle roles in Profile!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Flutter APK Build & Run */}
        {activeTab === 'apk' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Build and Run Native Android APK on Physical Device
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can run the pure Dart/Flutter code directly on an Android smartphone (Android 8.0+ / API 26+).
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  Download Flutter Source Project (.ZIP)
                </div>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Go to the <strong>"Flutter Source &amp; ZIP Export"</strong> tab and click <strong>"Download Full Flutter Project (.ZIP)"</strong>. Extract the zip folder on your laptop/PC.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  Enable USB Debugging on Your Android Phone
                </div>
                <p className="text-slate-400 pl-7 text-[11px]">
                  On your phone, go to <strong>Settings → About Phone</strong> and tap <strong>Build Number</strong> 7 times. Then go to <strong>Developer Options</strong> and toggle on <strong>USB Debugging</strong>. Connect your phone to your computer with a USB cable.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  Run Flutter Command
                </div>
                <div className="pl-7">
                  <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-blue-300 font-mono text-[11px] overflow-x-auto select-all">
                    cd flutter_sams{'\n'}
                    flutter pub get{'\n'}
                    flutter run --release
                  </pre>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Or generate an installable APK: <code className="text-slate-300 font-mono">flutter build apk --release</code> (find it in <code className="text-slate-300 font-mono">build/app/outputs/flutter-apk/app-release.apk</code> and install on phone).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px]">
                    4
                  </span>
                  Sign In on Your Phone
                </div>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Launch SAMS on your phone and log in with <strong className="text-white">{userEmail}</strong> and password <code className="text-slate-300 font-mono">password123</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-950 px-5 sm:px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Target OS: Android 8.0+ (API 26+) &amp; iOS 14+
          </span>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
