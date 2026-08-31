/**
 * BR-08: payment method is restricted to exactly four values across the whole app
 * (`admission.service.ts` DepositType, `installment.service.ts` payment enum).
 */
export type PaymentMethod = 'cash' | 'upi' | 'cheque_dd' | 'bank_transfer';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  cheque_dd: 'Cheque / DD',
  bank_transfer: 'Bank Transfer',
};

export const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'upi', 'cheque_dd', 'bank_transfer'];
