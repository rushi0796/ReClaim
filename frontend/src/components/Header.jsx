import React from 'react';

export default function Header({ health, isHealthLoading }) {
  const isOk = health && health.status === 'ok';

  return (
    <header className="bg-white border-b border-[#EAECF0] sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center">
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center font-semibold text-sm tracking-tight shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#111827] tracking-tight">RECLAIM</span>
              <span className="text-xs text-[#667085] font-normal hidden sm:inline">•</span>
              <span className="text-xs text-[#667085] font-medium hidden sm:inline">AI Revenue Recovery</span>
            </div>
            <p className="text-[11px] text-[#98A2B3] leading-none mt-0.5">
              Merchant recovery intelligence
            </p>
          </div>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center space-x-2.5 text-xs">
          {isHealthLoading ? (
            <span className="text-[#98A2B3] font-medium">Connecting...</span>
          ) : isOk ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#ABE5C6] text-[#027A48] font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span>
              <span>Offline</span>
            </div>
          )}

          <span className="px-2.5 py-1 rounded-md bg-[#F2F4F7] text-[#344054] font-medium text-[11px]">
            Test Mode
          </span>
        </div>
      </div>
    </header>
  );
}
