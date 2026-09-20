import type { JurisdictionBreakdown, LineStatus } from "@/lib/types";

const EXTRACTION_CONFIDENCE_THRESHOLD = 0.75;
const CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.75;

/**
 * The three-way comparison outcome — the centerpiece of this workflow, per
 * the brief. Ambiguous or low-confidence lines are routed to a human rather
 * than silently resolved; only clean lines get compared at all.
 */
export function classifyLine(params: {
  amount: number;
  appliedTax: number;
  expectedTax: number;
  extractionConfidence: number;
  classificationConfidence: number;
  jurisdiction: JurisdictionBreakdown;
}): { status: LineStatus; reviewReason?: string } {
  const { amount, appliedTax, expectedTax, extractionConfidence, classificationConfidence, jurisdiction } = params;

  if (extractionConfidence < EXTRACTION_CONFIDENCE_THRESHOLD) {
    return {
      status: "Needs Review",
      reviewReason: `Low-confidence extraction (${Math.round(extractionConfidence * 100)}%) — verify this line item manually.`,
    };
  }

  if (classificationConfidence < CLASSIFICATION_CONFIDENCE_THRESHOLD) {
    return {
      status: "Needs Review",
      reviewReason: "Line-item classification is ambiguous (Material vs. Equipment) — verify manually.",
    };
  }

  if (jurisdiction.ambiguous) {
    return { status: "Needs Review", reviewReason: jurisdiction.ambiguousReason };
  }

  const tolerance = Math.max(0.5, amount * 0.003);
  const variance = appliedTax - expectedTax;

  if (variance > tolerance) return { status: "Recovery Candidate" };
  if (variance < -tolerance) return { status: "Underpayment Flag" };
  return { status: "Match" };
}
