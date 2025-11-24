/**
 * Date and time utility functions
 * Pure functions for date operations
 */

/**
 * Check if a date is valid (not in the past)
 * @param selectedDate - Date to validate
 * @returns True if date is today or in the future
 */
export function isValidAppointmentDate(selectedDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
}

/**
 * Format time slot to HH:MM format
 * @param time - Time string (HH:MM:SS or HH:MM)
 * @returns Formatted time string (HH:MM)
 */
export function formatTimeSlot(time: string): string {
  return time.substring(0, 5);
}

/**
 * Compare two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1: Date, date2: Date): number {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Sort appointments by date (earliest first)
 * @param appointments - Array of appointments with appointment_date
 * @returns Sorted array
 */
export function sortAppointmentsByDate<T extends { appointment_date: Date | string }>(
  appointments: T[]
): T[] {
  return [...appointments].sort((a, b) => {
    const dateA = new Date(a.appointment_date).getTime();
    const dateB = new Date(b.appointment_date).getTime();
    return dateA - dateB;
  });
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
}





