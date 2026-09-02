import React from 'react';

export default function Topbar({ setIsMobileOpen, activePage, setActivePage }) {
  const pageTitles = {
    overview: 'Overview',
    payments: 'Failed Payments',
    recovery: 'Recovery Command',
    analytics: 'Analytics & Validation',
    audit: 'Audit Log',
  };

  const handleHomeClick = () => {
    if (setActivePage) setActivePage('overview');
  };

  return (
    <header className="lg:hidden bg-white border-b border-slate-200 h-14 px-4 flex items-center justify-between sticky top-0 z-40 font-sans">
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-900 shrink-0"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Clickable Brand Logo in Mobile Topbar */}
        <button
          type="button"
          onClick={handleHomeClick}
          aria-label="Go to ReClaim home"
          className="flex items-center space-x-2 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-900 rounded p-1"
        >
          <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
            R
          </div>
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-bold text-sm text-slate-900 tracking-tight">RECLAIM</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600 truncate">
              {pageTitles[activePage] || 'Dashboard'}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
          TEST MODE
        </span>
        <span className="hidden sm:inline text-[9px] font-mono text-slate-400 uppercase tracking-wider">
          RUSHIKESH.STUDIO
        </span>
      </div>
    </header>
  );
}
