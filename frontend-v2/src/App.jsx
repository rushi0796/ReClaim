import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './pages/Overview';
import Payments from './pages/Payments';
import Recovery from './pages/Recovery';
import Analytics from './pages/Analytics';
import Audit from './pages/Audit';
import { fetchHealth, batchAnalyze, batchValidate, fetchAuditLogs } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [healthData, setHealthData] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [batchValidationData, setBatchValidationData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditLogs = async () => {
    try {
      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err.message);
    }
  };

  useEffect(() => {
    async function initData() {
      try {
        const [h, b, bv, logs] = await Promise.all([
          fetchHealth().catch(() => ({ status: 'ok', version: '0.1.0' })),
          batchAnalyze().catch(() => null),
          batchValidate().catch(() => null),
          fetchAuditLogs().catch(() => [])
        ]);

        setHealthData(h);
        setBatchData(b);
        setBatchValidationData(bv);
        setAuditLogs(logs);

        if (b && b.decisions) {
          setPaymentsList(b.decisions);
        }
      } catch (err) {
        console.warn('Init fetch error:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  const handleNavigateAudit = () => {
    setActivePage('audit');
    loadAuditLogs();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <Overview
            batchData={batchData}
            batchValidationData={batchValidationData}
            payments={paymentsList}
            auditLogs={auditLogs}
            onRefreshAudit={loadAuditLogs}
            onNavigateAudit={handleNavigateAudit}
          />
        );

      case 'payments':
        return (
          <Payments
            payments={paymentsList}
            auditLogs={auditLogs}
            onRefreshAudit={loadAuditLogs}
            onNavigateAudit={handleNavigateAudit}
          />
        );

      case 'recovery':
        return (
          <Recovery
            batchData={batchData}
            auditLogs={auditLogs}
            payments={paymentsList}
          />
        );

      case 'analytics':
        return (
          <Analytics
            batchData={batchData}
            batchValidationData={batchValidationData}
          />
        );

      case 'audit':
        return (
          <Audit
            auditLogs={auditLogs}
          />
        );

      default:
        return (
          <Overview
            batchData={batchData}
            batchValidationData={batchValidationData}
            payments={paymentsList}
            auditLogs={auditLogs}
            onRefreshAudit={loadAuditLogs}
            onNavigateAudit={handleNavigateAudit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Topbar for Mobile */}
      <Topbar
        setIsMobileOpen={setIsMobileOpen}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Sidebar for Desktop & Drawer for Mobile */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        health={healthData}
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Desktop Header Strip */}
        <header className="hidden lg:flex items-center justify-between px-8 h-14 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs tracking-tight text-slate-900">RECLAIM</span>
            <span className="text-slate-300 font-bold text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">AI Revenue Recovery</span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
              TEST MODE
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              RUSHIKESH.STUDIO
            </span>
          </div>
        </header>

        <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-mono">Loading RECLAIM recovery engine data...</p>
            </div>
          ) : (
            renderPage()
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-3 px-6 text-center text-[11px] text-slate-500 font-mono flex items-center justify-between max-w-[1280px] w-full mx-auto">
          <span>© 2026 RUSHIKESH.STUDIO</span>
          <span className="text-slate-400">Built with ReClaim</span>
        </footer>
      </div>
    </div>
  );
}
