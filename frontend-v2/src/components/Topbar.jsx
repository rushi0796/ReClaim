import React from 'react';

export default function Topbar({ setIsMobileOpen, activePage }) {
  const pageTitles = {
    overview: 'Overview',
    payments: 'Failed Payments',
    recovery: 'Recovery Command',
    analytics: 'Analytics & Validation',
    audit: 'Audit Log',
  };

  return (
    <header className="lg:hidden bg-white border-b border-slate-200 h-14 px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
            R
          </div>
          <span className="font-bold text-sm text-slate-900">RECLAIM</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-medium text-slate-600 capitalize">
            {pageTitles[activePage] || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-[11px] font-mono text-slate-600">Test Mode</span>
      </div>
    </header>
  );
}
