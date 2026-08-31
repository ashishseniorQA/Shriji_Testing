import { expect as baseExpect } from '@playwright/test';
import { calculateExpectedGst } from '@test-data/fixtures/gst';

export interface ActualGstFigures {
  base: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

function isClose(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) <= epsilon;
}

/**
 * Domain-specific matcher for BR-11 (18% tax-inclusive GST, odd-paisa-to-SGST
 * rounding). `fees` is the amount actually paid/received — the matcher recomputes
 * the expected Base/CGST/SGST from it and compares against whatever the app displayed.
 *
 * Usage: `expect(actual).toHaveCorrectGstSplit(10_000)`
 */
export const expect = baseExpect.extend({
  toHaveCorrectGstSplit(actual: ActualGstFigures, fees: number) {
    const expected = calculateExpectedGst(fees);
    const pass =
      isClose(actual.base, expected.base) &&
      isClose(actual.cgst, expected.cgst) &&
      isClose(actual.sgst, expected.sgst) &&
      isClose(actual.grandTotal, fees);

    return {
      pass,
      message: () =>
        `BR-11 GST split check for Fees ₹${fees}:\n` +
        `  expected — Base ₹${expected.base}, CGST ₹${expected.cgst}, SGST ₹${expected.sgst}, Grand Total ₹${fees}\n` +
        `  actual   — Base ₹${actual.base}, CGST ₹${actual.cgst}, SGST ₹${actual.sgst}, Grand Total ₹${actual.grandTotal}`,
    };
  },
});

declare module '@playwright/test' {
  interface Matchers<R, T> {
    toHaveCorrectGstSplit(fees: number): R;
  }
}
