/**
 * Payment utility functions
 * Pure functions for payment calculations
 */

export interface Insurance {
  name: string;
  coverage_percentage: number;
}

/**
 * Calculate the amount a patient pays after insurance coverage
 * @param totalAmount - Total amount before insurance
 * @param insurance - Insurance object with coverage percentage, or null if no insurance
 * @returns Amount the patient needs to pay
 */
export function calculatePatientAmount(totalAmount: number, insurance: Insurance | null): number {
  if (!insurance) {
    return totalAmount;
  }
  const coverage = (totalAmount * insurance.coverage_percentage) / 100;
  return totalAmount - coverage;
}

/**
 * Calculate insurance coverage amount
 * @param totalAmount - Total amount
 * @param coveragePercentage - Insurance coverage percentage
 * @returns Amount covered by insurance
 */
export function calculateInsuranceCoverage(totalAmount: number, coveragePercentage: number): number {
  return (totalAmount * coveragePercentage) / 100;
}

/**
 * Check if an appointment has a completed payment
 * @param payments - Array of payment objects
 * @returns True if at least one payment has status 'completed'
 */
export function hasPayment(payments: Array<{ status: string }> | undefined): boolean {
  if (!payments || payments.length === 0) {
    return false;
  }
  return payments.some(payment => payment.status === 'completed');
}

/**
 * Format amount for display
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted amount string
 */
export function formatAmount(amount: number, decimals: number = 0): string {
  return amount.toFixed(decimals);
}

/**
 * Validate payment status
 * @param status - Payment status to validate
 * @returns True if status is valid
 */
export function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'completed', 'failed'];
  return validStatuses.includes(status);
}

/**
 * Validate payment type
 * @param type - Payment type to validate
 * @returns True if type is valid
 */
export function isValidPaymentType(type: string): boolean {
  const validTypes = ['consultation', 'lab_test', 'medication'];
  return validTypes.includes(type);
}





