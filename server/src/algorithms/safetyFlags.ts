import { MedicineItem, SafetyFlag } from '../../../shared/types';

// Curated static pairs per Section 5.4
export const KNOWN_INTERACTION_PAIRS: [string, string][] = [
  ['aspirin', 'ibuprofen'],
  ['warfarin', 'aspirin'],
  ['warfarin', 'ibuprofen'],
  ['metformin', 'contrast'],
  ['lisinopril', 'spironolactone'],
  ['ciprofloxacin', 'theophylline'],
  ['methotrexate', 'ibuprofen'],
  ['ssri', 'nsaid'],
];

export const HIGH_RISK_KEYWORDS = [
  'anaphylaxis',
  'overdose',
  'emergency',
  'resuscitation',
  'poisoning',
  'cardiac arrest',
  'stroke',
];

const DURATION_INDICATORS = [
  'day',
  'days',
  'week',
  'weeks',
  'month',
  'months',
  'ongoing',
  'continue',
  'daily',
  'stat',
  'sos',
  'prn',
  'as needed',
  'for ',
];

export function detectSafetyFlags(
  medicines: MedicineItem[],
  plainExplanationEn: string
): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const explanationLower = (plainExplanationEn || '').toLowerCase();

  // 1. HIGH_RISK_KEYWORD check (High severity)
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (explanationLower.includes(kw)) {
      flags.push({
        code: 'HIGH_RISK_KEYWORD',
        severity: 'high',
        message:
          'Important: Document contains emergency terminology. Please seek immediate professional emergency medical care if there is acute distress.',
      });
      break;
    }
  }

  // 2. KNOWN_INTERACTION_PAIR check (High severity)
  const normalizedNames = medicines.map((m) => (m.name || '').toLowerCase());
  for (const [drugA, drugB] of KNOWN_INTERACTION_PAIRS) {
    const hasA = normalizedNames.some((n) => n.includes(drugA));
    const hasB = normalizedNames.some((n) => n.includes(drugB));
    if (hasA && hasB) {
      // Find original casing for display
      const medA = medicines.find((m) => m.name.toLowerCase().includes(drugA))?.name || drugA;
      const medB = medicines.find((m) => m.name.toLowerCase().includes(drugB))?.name || drugB;
      flags.push({
        code: 'KNOWN_INTERACTION_PAIR',
        severity: 'high',
        message: `${medA} and ${medB} are sometimes flagged for interaction. Please confirm this combination with your doctor.`,
      });
    }
  }

  // 3. Per-medicine checks: ILLEGIBLE_DOSE (Medium) & MISSING_DURATION (Low)
  for (const med of medicines) {
    const schedule = (med.schedule || '').trim().toLowerCase();

    // ILLEGIBLE_DOSE
    if (!schedule || schedule === 'uncertain' || schedule === 'null' || schedule === 'illegible' || med.confidence === 'low') {
      flags.push({
        code: 'ILLEGIBLE_DOSE',
        severity: 'medium',
        message: `The dosage for ${med.name} wasn't clear enough to read confidently. Please confirm with your pharmacist before taking it.`,
      });
    } else {
      // MISSING_DURATION
      const hasDuration = DURATION_INDICATORS.some((ind) => schedule.includes(ind));
      if (!hasDuration) {
        flags.push({
          code: 'MISSING_DURATION',
          severity: 'low',
          message: `It's not clear how long to take ${med.name} for. Worth double-checking.`,
        });
      }
    }
  }

  // Sort: high > medium > low per Section 5.4
  const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  flags.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return flags;
}
