import React from 'react';
import { OcrConfidenceLevel } from '../../../shared/types';
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';

interface Props {
  confidence: OcrConfidenceLevel;
  onRetake?: () => void;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence, onRetake }) => {
  if (confidence === 'high') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        High Reading Confidence
      </div>
    );
  }

  if (confidence === 'medium') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Moderate Confidence (Some handwriting was faint)
      </div>
    );
  }

  // Low confidence warning banner per Section 10.2
  return (
    <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-orange-950 my-3 shadow-sm">
      <div className="flex items-start gap-3">
        <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm">Low Reading Confidence</div>
          <p className="text-xs sm:text-sm text-orange-900 mt-1 leading-relaxed">
            We had trouble reading parts of this clearly. Here's our best attempt — please double check the details below, or try a clearer photo.
          </p>
          {onRetake && (
            <button
              onClick={onRetake}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-medium transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
