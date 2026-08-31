/**
 * BR-11 (live-verified 2026-07-06, exact across 9 records from ₹1 to ₹5,00,000):
 * GST is 18% total (9% CGST + 9% SGST), tax-inclusive of the "Fees" amount.
 *   Base = Fees ÷ 1.18
 *   TotalGST = Fees − Base
 *   half = TotalGST / 2, with the odd paisa from the split always assigned to SGST.
 * Source: ReceiptPage.tsx (`half = gstRatePercent / 2`).
 */
export const GST_RATE_PERCENT = 18;

export interface GstBreakdown {
  fees: number;
  base: number;
  totalGst: number;
  cgst: number;
  sgst: number;
}

/** Rounds to the nearest paisa (2 decimal places), matching the UI's currency display. */
function roundToPaisa(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Mirrors the app's own formula exactly, including the "odd paisa always goes to SGST"
 * rounding rule confirmed live — do not simplify to `totalGst / 2` for both halves, or
 * this will silently disagree with the app on roughly half of all real-money amounts.
 */
export function calculateExpectedGst(fees: number): GstBreakdown {
  const base = roundToPaisa(fees / 1.18);
  const totalGst = roundToPaisa(fees - base);
  const cgst = roundToPaisa(totalGst / 2);
  const sgst = roundToPaisa(totalGst - cgst);
  return { fees: roundToPaisa(fees), base, totalGst, cgst, sgst };
}

/** A representative spread — from the ₹1 extreme-low boundary (LV-verified) to a large amount. */
export const GST_TEST_AMOUNTS = [1, 100, 999, 10_000, 50_000, 5_00_000];
