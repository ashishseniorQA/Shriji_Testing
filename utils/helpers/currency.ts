/** Strips ₹/commas/whitespace and parses an on-screen currency string to a number. */
export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, '');
  return Number(cleaned);
}
