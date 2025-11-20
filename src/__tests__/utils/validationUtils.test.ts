import { describe, it, expect } from 'vitest';

/**
 * Validation Utility Functions Tests
 */

describe('Validation Utilities', () => {
  describe('Email validation', () => {
    it('should validate correct email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Phone number validation', () => {
    it('should validate phone number format (10 digits)', () => {
      const phoneRegex = /^\d{10}$/;
      const validPhones = ['0781234567', '0798765432', '0730000000'];

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const phoneRegex = /^\d{10}$/;
      const invalidPhones = ['12345', '07812345678', 'abc1234567', '078-123-4567'];

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });
  });

  describe('Required field validation', () => {
    it('should validate non-empty strings', () => {
      const isValid = (value: string) => value.trim().length > 0;

      expect(isValid('test')).toBe(true);
      expect(isValid('  test  ')).toBe(true);
      expect(isValid('')).toBe(false);
      expect(isValid('   ')).toBe(false);
    });

    it('should validate required fields are present', () => {
      const validateRequired = (fields: Record<string, any>, requiredFields: string[]): boolean => {
        return requiredFields.every(field => {
          const value = fields[field];
          return value !== undefined && value !== null && value !== '';
        });
      };

      const data = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      };

      expect(validateRequired(data, ['email', 'password'])).toBe(true);
      expect(validateRequired(data, ['email', 'password', 'missing'])).toBe(false);
    });
  });

  describe('Number validation', () => {
    it('should validate positive numbers', () => {
      const isPositive = (num: number) => num > 0;

      expect(isPositive(100)).toBe(true);
      expect(isPositive(0.5)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-10)).toBe(false);
    });

    it('should validate number ranges', () => {
      const isInRange = (num: number, min: number, max: number) => num >= min && num <= max;

      expect(isInRange(50, 0, 100)).toBe(true);
      expect(isInRange(0, 0, 100)).toBe(true);
      expect(isInRange(100, 0, 100)).toBe(true);
      expect(isInRange(-1, 0, 100)).toBe(false);
      expect(isInRange(101, 0, 100)).toBe(false);
    });

    it('should validate percentage values (0-100)', () => {
      const isValidPercentage = (num: number) => num >= 0 && num <= 100;

      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage(-1)).toBe(false);
    });
  });

  describe('Amount validation', () => {
    it('should validate positive amounts', () => {
      const isValidAmount = (amount: number) => amount > 0 && !isNaN(amount) && isFinite(amount);

      expect(isValidAmount(1000)).toBe(true);
      expect(isValidAmount(0.01)).toBe(true);
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-100)).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
    });

    it('should validate amount is a number', () => {
      const isNumber = (value: any): value is number => {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
      };

      expect(isNumber(100)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber('100')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });
});


