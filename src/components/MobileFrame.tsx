import React from 'react';
import { Wifi, WifiOff, Battery, Bell, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isOnline: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  pendingSyncCount: number;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isOnline,
  isFullscreen,
  onToggleFullscreen,
  pendingSyncCount,
}) => {
  if (isFullscreen) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden">
        {/* Top Status Bar */}
        <div className="bg-slate-950 text-white px-4 py-2 flex items-center justify-between text-xs select-none z-50">
          <div className="font-semibold tracking-wider">10:30 AM</div>
          <div className="flex items-center gap-3">
            {pendingSyncCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                {pendingSyncCount} Pending Sync
              </span>
            )}
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" /> 4G LTE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4 text-slate-300" />
              <span>96%</span>
            </div>
            <button
              onClick={onToggleFullscreen}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-0 sm:p-4 w-full">
      {/* Device Frame Wrapper - seamlessly full width on actual mobile screens, framed on desktop */}
      <div className="relative w-full max-sm:max-w-none max-sm:rounded-none max-sm:p-0 max-sm:border-none max-sm:ring-0 max-sm:h-[82vh] sm:max-w-[390px] sm:h-[780px] bg-slate-950 sm:rounded-[48px] sm:p-3 shadow-2xl ring-1 ring-slate-800/80 shadow-slate-950/50 flex flex-col transition-all">
        {/* Device Notch & Speaker (hidden on mobile phone screens) */}
        <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-950 rounded-b-2xl z-30 items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 ml-3 mb-1"></div>
        </div>

        {/* Inner Phone Screen */}
        <div className="relative w-full h-full bg-slate-50 max-sm:rounded-none sm:rounded-[38px] overflow-hidden flex flex-col border border-slate-800/50 shadow-inner">
          {/* Mobile Status Bar */}
          <div className="w-full bg-white/95 backdrop-blur-sm px-4 sm:px-6 pt-2.5 sm:pt-3 pb-1.5 flex items-center justify-between text-xs text-slate-700 font-semibold select-none z-20 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-900">10:30</span>
            <div className="flex items-center gap-2">
              {pendingSyncCount > 0 && (
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold animate-pulse">
                  {pendingSyncCount} Sync
                </span>
              )}
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              )}
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-slate-500 font-normal">96%</span>
                <Battery className="w-3.5 h-3.5 text-slate-700" />
              </div>
              <button
                onClick={onToggleFullscreen}
                className="hidden sm:block p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                title="Fullscreen simulator"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* App Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="w-full bg-white/95 py-2 flex items-center justify-center select-none z-20">
            <div className="w-32 h-1 bg-slate-300 hover:bg-slate-400 transition-colors rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
