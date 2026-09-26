import React, { useState } from 'react';
import { SafetyFlag } from '../../../shared/types';
import { AlertOctagon, AlertTriangle, Info, Check } from 'lucide-react';

interface Props {
  flags: SafetyFlag[];
}

export const SafetyFlagsList: React.FC<Props> = ({ flags }) => {
  const [acknowledgedCodes, setAcknowledgedCodes] = useState<Record<string, boolean>>({});

  if (!flags || flags.length === 0) return null;

  const toggleAcknowledge = (code: string) => {
    setAcknowledgedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-2.5 my-4">
      {flags.map((flag, idx) => {
        const key = `${flag.code}-${idx}`;
        const isAck = acknowledgedCodes[key];

        if (flag.severity === 'high') {
          return (
            <div
              key={key}
              className={`p-4 rounded-xl border transition-all ${
                isAck
                  ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                  : 'bg-rose-50 border-rose-400 text-rose-950 shadow-md ring-2 ring-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      Doctor Confirmation Recommended
                    </span>
                  </div>
                  <p className="text-sm font-semibold mt-1.5 leading-snug">{flag.message}</p>

                  <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-medium text-rose-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAck || false}
                        onChange={() => toggleAcknowledge(key)}
                        className="w-4 h-4 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>I understand and will confirm this with my doctor / pharmacist</span>
                    </label>
                    {isAck && (
                      <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (flag.severity === 'medium') {
          return (
            <div key={key} className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-lg text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-amber-800 block">Pharmacist Verification Note:</span>
                <p className="text-xs sm:text-sm mt-0.5">{flag.message}</p>
              </div>
            </div>
          );
        }

        // Low severity
        return (
          <div key={key} className="p-3 bg-stone-100 border border-stone-300 rounded-lg text-stone-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{flag.message}</p>
          </div>
        );
      })}
    </div>
  );
};
