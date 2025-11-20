import { describe, it, expect } from 'vitest';
import {
  calculatePatientAmount,
  calculateInsuranceCoverage,
  hasPayment,
  formatAmount,
  isValidPaymentStatus,
  isValidPaymentType,
  type Insurance,
} from '../../utils/paymentUtils';

/**
 * Frontend Payment Utility Functions Tests
 * Tests for calculating patient amounts with insurance coverage
 */

describe('Payment Utilities', () => {
  describe('calculatePatientAmount', () => {
    it('should calculate patient payment correctly with 80% insurance coverage', () => {
      const totalAmount = 1000;
      const insurance: Insurance = { name: 'Test Insurance', coverage_percentage: 80 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBe(200);
    });

    it('should calculate patient payment correctly with 50% insurance coverage', () => {
      const totalAmount = 5000;
      const insurance: Insurance = { name: 'Test Insurance', coverage_percentage: 50 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBe(2500);
    });

    it('should return full amount when no insurance', () => {
      const totalAmount = 1000;
      const insurance = null;
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBe(1000);
    });

    it('should return 0 when insurance covers 100%', () => {
      const totalAmount = 1000;
      const insurance: Insurance = { name: 'Full Coverage', coverage_percentage: 100 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBe(0);
    });

    it('should handle decimal amounts correctly', () => {
      const totalAmount = 1234.56;
      const insurance: Insurance = { name: 'Test Insurance', coverage_percentage: 80 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBeCloseTo(246.91, 2);
    });

    it('should handle decimal coverage percentages', () => {
      const totalAmount = 1000;
      const insurance: Insurance = { name: 'Test Insurance', coverage_percentage: 75.5 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBeCloseTo(245, 1);
    });

    it('should handle zero amount', () => {
      const totalAmount = 0;
      const insurance: Insurance = { name: 'Test Insurance', coverage_percentage: 80 };
      const patientPays = calculatePatientAmount(totalAmount, insurance);

      expect(patientPays).toBe(0);
    });
  });

  describe('calculateInsuranceCoverage', () => {
    it('should calculate insurance coverage correctly with 80% coverage', () => {
      const totalAmount = 1000;
      const coverage = calculateInsuranceCoverage(totalAmount, 80);

      expect(coverage).toBe(800);
    });

    it('should calculate insurance coverage correctly with 50% coverage', () => {
      const totalAmount = 5000;
      const coverage = calculateInsuranceCoverage(totalAmount, 50);

      expect(coverage).toBe(2500);
    });

    it('should return 0 coverage when percentage is 0', () => {
      const totalAmount = 1000;
      const coverage = calculateInsuranceCoverage(totalAmount, 0);

      expect(coverage).toBe(0);
    });

    it('should return full amount when percentage is 100', () => {
      const totalAmount = 1000;
      const coverage = calculateInsuranceCoverage(totalAmount, 100);

      expect(coverage).toBe(1000);
    });

    it('should handle decimal percentages', () => {
      const totalAmount = 1000;
      const coverage = calculateInsuranceCoverage(totalAmount, 75.5);

      expect(coverage).toBe(755);
    });
  });

  describe('hasPayment', () => {
    it('should return true if appointment has completed payment', () => {
      const payments = [
        { status: 'completed' },
      ];

      expect(hasPayment(payments)).toBe(true);
    });

    it('should return false if appointment has no payments', () => {
      const payments: Array<{ status: string }> = [];

      expect(hasPayment(payments)).toBe(false);
    });

    it('should return false if payments is undefined', () => {
      expect(hasPayment(undefined)).toBe(false);
    });

    it('should return false if payment status is not completed', () => {
      const payments = [
        { status: 'pending' },
      ];

      expect(hasPayment(payments)).toBe(false);
    });

    it('should return true if any payment is completed among multiple payments', () => {
      const payments = [
        { status: 'pending' },
        { status: 'completed' },
        { status: 'failed' },
      ];

      expect(hasPayment(payments)).toBe(true);
    });

    it('should return false if all payments are failed', () => {
      const payments = [
        { status: 'failed' },
        { status: 'pending' },
      ];

      expect(hasPayment(payments)).toBe(false);
    });
  });

  describe('formatAmount', () => {
    it('should format amount with 0 decimal places by default', () => {
      const amount = 1234.567;
      const formatted = formatAmount(amount);

      expect(formatted).toBe('1235');
    });

    it('should format amount with 2 decimal places', () => {
      const amount = 1234.567;
      const formatted = formatAmount(amount, 2);

      expect(formatted).toBe('1234.57');
    });

    it('should format amount with 1 decimal place', () => {
      const amount = 1234.5;
      const formatted = formatAmount(amount, 1);

      expect(formatted).toBe('1234.5');
    });

    it('should handle zero amount', () => {
      const amount = 0;
      const formatted = formatAmount(amount);

      expect(formatted).toBe('0');
    });

    it('should handle negative amounts', () => {
      const amount = -100;
      const formatted = formatAmount(amount);

      expect(formatted).toBe('-100');
    });
  });

  describe('isValidPaymentStatus', () => {
    it('should accept valid payment statuses', () => {
      expect(isValidPaymentStatus('pending')).toBe(true);
      expect(isValidPaymentStatus('completed')).toBe(true);
      expect(isValidPaymentStatus('failed')).toBe(true);
    });

    it('should reject invalid payment status', () => {
      expect(isValidPaymentStatus('invalid_status')).toBe(false);
      expect(isValidPaymentStatus('')).toBe(false);
      expect(isValidPaymentStatus('processing')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isValidPaymentStatus('Completed')).toBe(false);
      expect(isValidPaymentStatus('PENDING')).toBe(false);
    });
  });

  describe('isValidPaymentType', () => {
    it('should accept valid payment types', () => {
      expect(isValidPaymentType('consultation')).toBe(true);
      expect(isValidPaymentType('lab_test')).toBe(true);
      expect(isValidPaymentType('medication')).toBe(true);
    });

    it('should reject invalid payment type', () => {
      expect(isValidPaymentType('invalid_type')).toBe(false);
      expect(isValidPaymentType('')).toBe(false);
      expect(isValidPaymentType('prescription')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isValidPaymentType('Consultation')).toBe(false);
      expect(isValidPaymentType('LAB_TEST')).toBe(false);
    });
  });
});