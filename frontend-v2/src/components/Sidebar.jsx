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

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-white border-r border-slate-200">
      <div>
        {/* Brand Header (~56-64px height alignment) */}
        <div className="flex items-center space-x-3 px-2 h-14 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            R
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">RECLAIM</h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">AI Revenue Recovery</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
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

      {/* Bottom Footer Status */}
      <div className="pt-3 border-t border-slate-100 space-y-2 px-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Status</span>
          <div className="flex items-center space-x-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className={isOk ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              {isOk ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Environment</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
            Test Mode
          </span>
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
