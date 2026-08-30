import React from 'react';

export default function ReasonCard({ reason }) {
  if (!reason) return null;

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-2">
        Decision rationale
      </h4>
      <p className="text-sm text-[#344054] leading-relaxed font-normal">
        {reason}
      </p>
    </div>
  );
}
