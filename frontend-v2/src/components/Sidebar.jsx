import React from 'react';

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen, health }) {
  const isOk = health && health.status === 'ok';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'payments', label: 'Failed Payments', icon: '💳' },
    { id: 'recovery', label: 'Recovery Command', icon: '⚡' },
    { id: 'analytics', label: 'Analytics & LOOCV', icon: '📈' },
    { id: 'audit', label: 'Audit Log', icon: '📜' },
  ];

  const handleHomeClick = () => {
    setActivePage('overview');
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-white border-r border-slate-200 font-sans">
      <div>
        {/* Brand Header - Clickable Home Button */}
        <button
          type="button"
          onClick={handleHomeClick}
          aria-label="Go to ReClaim home"
          className="w-full flex items-center space-x-3 px-2 py-2 mb-4 border-b border-slate-100 rounded-lg text-left hover:bg-slate-50 transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
        >
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 group-hover:bg-slate-800">
            R
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none group-hover:text-slate-900">
              RECLAIM
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              AI Revenue Recovery
            </p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider leading-none mt-1">
              by RUSHIKESH.STUDIO
            </p>
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePage(item.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Status & Creator Brand */}
      <div className="pt-3 border-t border-slate-100 space-y-2 px-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">System Status</span>
          <div className="flex items-center space-x-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className={isOk ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              {isOk ? 'Operational' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Razorpay Engine</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
            TEST MODE
          </span>
        </div>

        <div className="pt-2 text-[10px] font-mono text-slate-400 text-center tracking-wider uppercase border-t border-slate-100/60">
          RUSHIKESH.STUDIO
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed 240px Sidebar */}
      <aside className="hidden lg:block w-[240px] shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          ></div>
          <div className="relative w-[240px] max-w-[85%] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
