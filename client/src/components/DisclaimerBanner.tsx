import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 rounded-r-md text-amber-900 shadow-sm flex items-start gap-3 my-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm font-medium leading-relaxed">
        <span className="font-semibold">Medical Reading Aid:</span> Saral helps you understand medical documents but is not a substitute for professional medical advice. Always confirm with your doctor or pharmacist before making any decisions.
      </div>
    </div>
  );
};
