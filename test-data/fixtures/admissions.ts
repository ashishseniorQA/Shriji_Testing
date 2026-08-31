import { uniqueAdmissionNo, uniqueRollNo, uniquePhoneNumber } from '@utils/helpers/unique-id';
import type { AdmissionFormInput } from '@utils/page-objects/add-admission.page';
import type { PaymentMethod } from './installments';

/** Course expected to exist in the target environment's Settings > Courses list. */
export const TEST_COURSE = process.env.TEST_COURSE ?? 'BCA';

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A minimal-but-valid admission payload. Every call produces a fresh, unique
 * admission/roll number (BR-01: nothing here can ever be deleted, so collisions across
 * runs must be avoided by construction, not by cleanup).
 */
export function buildValidAdmission(overrides: Partial<AdmissionFormInput> = {}): AdmissionFormInput {
  const finalFees = overrides.finalFees ?? 50_000;
  return {
    admissionNo: uniqueAdmissionNo(),
    rollNo: uniqueRollNo(),
    name: 'Playwright Test Student',
    fatherName: 'Playwright Test Father',
    courseName: TEST_COURSE,
    paymentMethod: 'cash' as PaymentMethod,
    depositDate: todayISODate(),
    fees: 10_000,
    finalFees,
    installmentCycleMonths: 6,
    mobile: uniquePhoneNumber(),
    fatherMobile: uniquePhoneNumber(),
    remarks: 'Created by Playwright automation — safe to ignore.',
    ...overrides,
  };
}

/** BR-02: fees paid at admission time cannot exceed the final (total) fee. */
export function buildOverpaidAdmission(): AdmissionFormInput {
  return buildValidAdmission({ fees: 60_000, finalFees: 50_000 });
}

/** BR-04: mobile is length-validated (10–15 chars) only — no digit-only regex enforced. */
export function buildAdmissionWithAlphaMobile(): AdmissionFormInput {
  return buildValidAdmission({ mobile: 'ABCDEFGHIJ' });
}

/** Extreme-low boundary confirmed live (BR-11): CGST/SGST computed correctly down to ₹1. */
export function buildOneRupeeAdmission(): AdmissionFormInput {
  return buildValidAdmission({ fees: 1, finalFees: 1 });
}
