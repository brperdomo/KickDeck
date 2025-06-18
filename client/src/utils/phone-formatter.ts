/**
 * Utility functions for standardizing phone number formatting
 * Formats all phone numbers to (XXX) XXX-XXXX format
 */

/**
 * Formats a phone number to the standard (XXX) XXX-XXXX format
 * @param phoneNumber - Raw phone number string in any format
 * @returns Formatted phone number or empty string if invalid
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';

  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different number lengths
  if (cleaned.length === 10) {
    // Standard US 10-digit number
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US number with country code
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 7) {
    // 7-digit local number - add default area code if needed
    return `(   ) ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  // Return original if we can't format it properly
  return phoneNumber;
}

/**
 * Validates if a phone number is in a valid format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;

  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Valid lengths: 7 (local), 10 (standard), 11 (with country code)
  return cleaned.length === 7 || cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

/**
 * Extracts just the digits from a phone number
 * @param phoneNumber - Phone number to clean
 * @returns Clean digits only
 */
export function cleanPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Phone number validation regex for Zod schemas
 */
export const PHONE_REGEX = /^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;