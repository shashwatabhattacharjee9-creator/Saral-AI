import React from 'react';
import { MedicineItem } from '../../../shared/types';
import { Pill, CheckCircle2, HelpCircle } from 'lucide-react';

interface Props {
  medicines: MedicineItem[];
}

export const MedicinesTable: React.FC<Props> = ({ medicines }) => {
  if (!medicines || medicines.length === 0) {
    return (
      <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-6 text-center text-stone-500">
        No specific medications could be extracted from this document.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm my-4">
      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-moss-600" />
          <h3 className="font-semibold text-sm text-stone-900">Extracted Medications ({medicines.length})</h3>
        </div>
        <span className="text-[11px] text-stone-500">Transcribed via AI Reading Aid</span>
      </div>

      <div className="divide-y divide-stone-100">
        {medicines.map((med, idx) => {
          const isLow = med.confidence === 'low';
          return (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-base">{med.name}</span>
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      <HelpCircle className="w-3 h-3 text-amber-600" /> Handwriting unclear
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confident read
                    </span>
                  )}
                </div>
                <p className="text-stone-700 text-sm mt-1 font-medium bg-parchment-100/60 p-2 rounded-lg border border-parchment-200">
                  <span className="text-stone-500 text-xs font-normal block mb-0.5">Dosage & Instructions:</span>
                  {med.schedule || 'Instructions not explicitly specified on document'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
