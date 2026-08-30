import React from 'react';
import AuditTimeline from '../components/AuditTimeline';

export default function Audit({ auditLogs = [] }) {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Complete, persistent history of all automated recovery decisions and Razorpay webhook dispatches
        </p>
      </div>

      <AuditTimeline auditLogs={auditLogs} />
    </div>
  );
}
