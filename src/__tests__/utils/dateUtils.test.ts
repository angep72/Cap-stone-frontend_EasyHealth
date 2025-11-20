import { describe, it, expect } from 'vitest';
import {
  isValidAppointmentDate,
  formatTimeSlot,
  compareDates,
  sortAppointmentsByDate,
  isToday,
  isFutureDate,
} from '../../utils/dateUtils';

/**
 * Date and Time Utility Functions Tests
 */

describe('Date Utilities', () => {
  describe('isValidAppointmentDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date('2025-12-31');
      const isValid = isValidAppointmentDate(futureDate);

      expect(isValid).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01');
      const isValid = isValidAppointmentDate(pastDate);

      expect(isValid).toBe(false);
    });

    it('should accept today as valid date', () => {
      const today = new Date();
      const isValid = isValidAppointmentDate(today);

      expect(isValid).toBe(true);
    });

    it('should handle dates with time components', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(14, 30, 0); // Set specific time

      const isValid = isValidAppointmentDate(futureDate);
      expect(isValid).toBe(true);
    });
  });

  describe('formatTimeSlot', () => {
    it('should format time slot correctly from HH:MM:SS format', () => {
      const time = '10:00:00';
      const formatted = formatTimeSlot(time);

      expect(formatted).toBe('10:00');
    });

    it('should handle time without seconds', () => {
      const time = '14:30';
      const formatted = formatTimeSlot(time);

      expect(formatted).toBe('14:30');
    });

    it('should handle midnight time', () => {
      const time = '00:00:00';
      const formatted = formatTimeSlot(time);

      expect(formatted).toBe('00:00');
    });

    it('should handle evening times', () => {
      const time = '23:59:59';
      const formatted = formatTimeSlot(time);

      expect(formatted).toBe('23:59');
    });
  });

  describe('compareDates', () => {
    it('should return -1 if first date is before second date', () => {
      const date1 = new Date('2024-12-01');
      const date2 = new Date('2024-12-02');
      const result = compareDates(date1, date2);

      expect(result).toBe(-1);
    });

    it('should return 1 if first date is after second date', () => {
      const date1 = new Date('2024-12-02');
      const date2 = new Date('2024-12-01');
      const result = compareDates(date1, date2);

      expect(result).toBe(1);
    });

    it('should return 0 if dates are equal', () => {
      const date1 = new Date('2024-12-01');
      const date2 = new Date('2024-12-01');
      const result = compareDates(date1, date2);

      expect(result).toBe(0);
    });

    it('should compare dates with different times correctly', () => {
      const date1 = new Date('2024-12-01T10:00:00');
      const date2 = new Date('2024-12-01T11:00:00');
      const result = compareDates(date1, date2);

      expect(result).toBe(-1);
    });
  });

  describe('sortAppointmentsByDate', () => {
    it('should sort appointments by date (earliest first)', () => {
      const appointments = [
        { appointment_date: new Date('2024-12-03'), id: '3' },
        { appointment_date: new Date('2024-12-01'), id: '1' },
        { appointment_date: new Date('2024-12-02'), id: '2' },
      ];

      const sorted = sortAppointmentsByDate(appointments);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should handle date strings', () => {
      const appointments = [
        { appointment_date: '2024-12-03', id: '3' },
        { appointment_date: '2024-12-01', id: '1' },
        { appointment_date: '2024-12-02', id: '2' },
      ];

      const sorted = sortAppointmentsByDate(appointments);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should not mutate original array', () => {
      const appointments = [
        { appointment_date: new Date('2024-12-03'), id: '3' },
        { appointment_date: new Date('2024-12-01'), id: '1' },
      ];

      const sorted = sortAppointmentsByDate(appointments);

      expect(sorted).not.toBe(appointments);
      expect(appointments[0].id).toBe('3'); // Original unchanged
    });

    it('should handle single appointment', () => {
      const appointments = [
        { appointment_date: new Date('2024-12-01'), id: '1' },
      ];

      const sorted = sortAppointmentsByDate(appointments);

      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe('1');
    });

    it('should handle empty array', () => {
      const appointments: Array<{ appointment_date: Date | string }> = [];

      const sorted = sortAppointmentsByDate(appointments);

      expect(sorted.length).toBe(0);
    });
  });

  describe('isToday', () => {
    it('should return true if date is today', () => {
      const today = new Date();
      const result = isToday(today);

      expect(result).toBe(true);
    });

    it('should return false if date is not today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = isToday(yesterday);

      expect(result).toBe(false);
    });

    it('should return false for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const result = isToday(future);

      expect(result).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should return true if date is in the future', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const result = isFutureDate(future);

      expect(result).toBe(true);
    });

    it('should return false if date is today', () => {
      const today = new Date();
      const result = isFutureDate(today);

      expect(result).toBe(false);
    });

    it('should return false if date is in the past', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const result = isFutureDate(past);

      expect(result).toBe(false);
    });

    it('should handle dates with time components', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      future.setHours(23, 59, 59);
      const result = isFutureDate(future);

      expect(result).toBe(true);
    });
  });
});