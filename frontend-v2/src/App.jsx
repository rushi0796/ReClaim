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

  const refreshData = async () => {
    try {
      const [b, logs] = await Promise.all([
        batchAnalyze().catch(() => null),
        fetchAuditLogs().catch(() => [])
      ]);
      setBatchData(b);
      setAuditLogs(logs);
      if (b && b.decisions) {
        setPaymentsList(b.decisions);
      }
    } catch (err) {
      console.warn('Failed to refresh data:', err.message);
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
            onRefreshQueue={refreshData}
            onNavigateAudit={handleNavigateAudit}
          />
        );

      case 'payments':
        return (
          <Payments
            payments={paymentsList}
            onRefreshAudit={loadAuditLogs}
            onRefreshQueue={refreshData}
            onNavigateAudit={handleNavigateAudit}
          />
        );

      case 'recovery':
        return (
          <Recovery
            payments={paymentsList}
            onRefreshAudit={loadAuditLogs}
            onNavigateAudit={handleNavigateAudit}
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
            onRefresh={loadAuditLogs}
          />
        );

      default:
        return (
          <Overview
            batchData={batchData}
            batchValidationData={batchValidationData}
            payments={paymentsList}
            onRefreshAudit={loadAuditLogs}
            onRefreshQueue={refreshData}
            onNavigateAudit={handleNavigateAudit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navigation */}
        <Topbar
          activePage={activePage}
          setActivePage={setActivePage}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></div>
              <span className="text-xs text-slate-500 font-mono">Initializing RECLAIM AI Engine...</span>
            </div>
          ) : (
            renderPage()
          )}
        </main>

        {/* Footer Attribution */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-sans">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center space-x-1 font-mono text-[11px]">
              <span className="font-bold text-slate-900">RECLAIM</span>
              <span>v1.0.0</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Razorpay Buildathon Edition</span>
            </div>
            <div className="text-[11px]">
              Created by <span className="font-bold text-slate-900">RUSHIKESH.STUDIO</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
