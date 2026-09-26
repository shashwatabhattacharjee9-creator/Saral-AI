import { MedicineItem, OcrConfidenceLevel } from '../../../shared/types';
import { config } from '../config';

export function classifyOcrConfidence(
  medicines: MedicineItem[],
  plainExplanationEn: string,
  threshold: number = config.ocrLowConfidenceRatioThreshold
): OcrConfidenceLevel {
  const countTotal = medicines.length;

  if (countTotal === 0) {
    return 'low';
  }

  let countLowConfidence = 0;

  for (const med of medicines) {
    const isExplicitLow = med.confidence === 'low';
    const nameLower = (med.name || '').toLowerCase();
    const explanationLower = (plainExplanationEn || '').toLowerCase();

    // Check if explanation contains an explicit uncertainty marker for that item
    const hasUncertaintyMarker =
      explanationLower.includes(`unclear whether ${nameLower}`) ||
      explanationLower.includes(`could not clearly read ${nameLower}`) ||
      explanationLower.includes(`uncertain dose for ${nameLower}`) ||
      explanationLower.includes(`illegible ${nameLower}`);

    if (isExplicitLow || hasUncertaintyMarker) {
      countLowConfidence++;
    }
  }

  if (countLowConfidence === 0) {
    return 'high';
  }

  const ratio = countLowConfidence / countTotal;
  if (ratio <= threshold) {
    return 'medium';
  }

  return 'low';
}
