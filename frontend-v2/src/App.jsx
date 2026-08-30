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
      <div className="flex-1 min-w-0">
        <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-mono">Loading RECLAIM recovery engine data...</p>
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>
    </div>
  );
}
