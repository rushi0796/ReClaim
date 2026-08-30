import React from 'react';

export default function EmptyState({ onSelectPreset }) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-8 text-center shadow-sm max-w-xl mx-auto my-6">
      <div className="w-10 h-10 rounded-full bg-[#F2F4F7] text-[#344054] flex items-center justify-center mx-auto mb-3 text-lg font-semibold">
        ⚡
      </div>

      <h3 className="text-base font-semibold text-[#111827] tracking-tight mb-1">
        Ready to analyze
      </h3>

      <p className="text-xs text-[#667085] mb-4 max-w-sm mx-auto">
        Enter a failed payment context above or select a preset to generate RECLAIM recovery intelligence:
      </p>

      <div className="text-xs text-[#344054] text-left max-w-xs mx-auto space-y-1.5 bg-[#F9FAFB] p-3.5 rounded-lg border border-[#EAECF0] font-sans">
        <div className="flex items-center space-x-2">
          <span className="text-[#12B76A] font-bold">•</span>
          <span>Recommended intervention</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#12B76A] font-bold">•</span>
          <span>Recovery probability estimate</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#12B76A] font-bold">•</span>
          <span>Expected recovered value</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#12B76A] font-bold">•</span>
          <span>Historical empirical reasoning</span>
        </div>
      </div>

      <div className="mt-5 flex justify-center space-x-2">
        <button
          type="button"
          onClick={() => onSelectPreset('demo1')}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#111827] text-white font-medium hover:bg-[#1f2937] transition shadow-2xs"
        >
          Load Demo Payment (₹999)
        </button>
      </div>
    </div>
  );
}
