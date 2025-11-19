/**
 * ID Format Helpers
 * 
 * Utilities for validating and working with UUIDs in the RumPlay system.
 * The system uses UUID v4 format (36 characters with hyphens).
 */

/**
 * Validates if a string is a valid UUID v4 format (36 characters with hyphens)
 * 
 * @param id - The ID to validate
 * @returns true if valid UUID v4, false otherwise
 * 
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('550e8400e29b41d4a716446655440000') // false (no hyphens)
 * isValidUUID('invalid') // false
 */
export const isValidUUID = (id: string | null | undefined): id is string => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Validates if a string looks like a UUID (with or without hyphens)
 * Less strict than isValidUUID, useful for debugging
 * 
 * @param id - The ID to check
 * @returns true if it looks like a UUID
 */
export const looksLikeUUID = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  const noHyphens = id.replace(/-/g, '');
  return noHyphens.length === 32 && /^[0-9a-f]+$/i.test(noHyphens);
};

/**
 * Converts a 32-character UUID (no hyphens) to 36-character format (with hyphens)
 * 
 * @param id - The 32-character UUID without hyphens
 * @returns The 36-character UUID with hyphens, or null if invalid
 * 
 * @example
 * addHyphensToUUID('550e8400e29b41d4a716446655440000')
 * // Returns: '550e8400-e29b-41d4-a716-446655440000'
 */
export const addHyphensToUUID = (id: string | null | undefined): string | null => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  const clean = id.replace(/-/g, '');
  
  if (clean.length !== 32 || !/^[0-9a-f]+$/i.test(clean)) {
    console.warn('[idHelpers] Invalid UUID format:', id);
    return null;
  }
  
  return `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20, 32)}`;
};

/**
 * Removes hyphens from a UUID
 * 
 * @param id - The UUID with hyphens
 * @returns The UUID without hyphens
 * 
 * @example
 * removeHyphensFromUUID('550e8400-e29b-41d4-a716-446655440000')
 * // Returns: '550e8400e29b41d4a716446655440000'
 */
export const removeHyphensFromUUID = (id: string | null | undefined): string | null => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  return id.replace(/-/g, '');
};

/**
 * Validates and throws an error if ID is invalid
 * Useful for asserting ID validity before making API calls
 * 
 * @param id - The ID to validate
 * @param name - Name of the ID field (for error message)
 * @throws Error if ID is invalid
 * 
 * @example
 * assertValidUUID(videoId, 'video_id');
 * // If invalid, throws: Error: video_id must be a valid UUID (36 characters)
 */
export const assertValidUUID = (id: string | null | undefined, name: string = 'ID'): asserts id is string => {
  if (!id) {
    throw new Error(`${name} is required`);
  }
  
  if (typeof id !== 'string') {
    throw new Error(`${name} must be a string (got ${typeof id})`);
  }
  
  if (id.length !== 36) {
    throw new Error(`${name} must be 36 characters (got ${id.length}). Did you mean to add hyphens?`);
  }
  
  if (!isValidUUID(id)) {
    throw new Error(`${name} has invalid UUID format: ${id}`);
  }
};

/**
 * Normalizes a UUID to the correct format (36 chars with hyphens)
 * Attempts to fix common issues automatically
 * 
 * @param id - The ID to normalize
 * @returns Normalized UUID or null if cannot be fixed
 * 
 * @example
 * normalizeUUID('550e8400e29b41d4a716446655440000') 
 * // Returns: '550e8400-e29b-41d4-a716-446655440000'
 * 
 * normalizeUUID('550e8400-e29b-41d4-a716-446655440000')
 * // Returns: '550e8400-e29b-41d4-a716-446655440000' (already valid)
 */
export const normalizeUUID = (id: string | null | undefined): string | null => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  if (isValidUUID(id)) {
    return id;
  }
  
  const idStr = id as string;
  const clean = idStr.replace(/-/g, '');
  if (clean.length === 32 && /^[0-9a-f]+$/i.test(clean)) {
    return addHyphensToUUID(clean);
  }
  
  return null;
};

/**
 * Gets the length of an ID and reports if it's in the expected format
 * Useful for debugging ID format issues
 * 
 * @param id - The ID to check
 * @returns Object with length info and validity
 */
export const getIdInfo = (id: string | null | undefined): {
  value: string | null;
  length: number;
  hasHyphens: boolean;
  isValid: boolean;
  expectedFormat: string;
} => {
  if (!id || typeof id !== 'string') {
    return {
      value: null,
      length: 0,
      hasHyphens: false,
      isValid: false,
      expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 chars)',
    };
  }
  
  return {
    value: id,
    length: id.length,
    hasHyphens: id.includes('-'),
    isValid: isValidUUID(id),
    expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 chars)',
  };
};

/**
 * Logs detailed ID information for debugging
 * 
 * @param id - The ID to debug
 * @param label - Label for the console log
 */
export const debugId = (id: string | null | undefined, label: string = 'ID'): void => {
  const info = getIdInfo(id);
  console.log(`[ID Debug] ${label}:`, {
    value: info.value,
    length: info.length,
    hasHyphens: info.hasHyphens,
    isValid: info.isValid,
    expected: info.expectedFormat,
  });
  
  if (!info.isValid && info.value) {
    if (info.length === 32 && !info.hasHyphens) {
      console.log(`[ID Debug] ${label}: Missing hyphens. Use addHyphensToUUID() to fix.`);
      console.log(`[ID Debug] ${label}: Fixed value:`, addHyphensToUUID(info.value));
    } else if (info.length !== 36) {
      console.log(`[ID Debug] ${label}: Wrong length. Expected 36, got ${info.length}`);
    }
  }
};

/**
 * Converts ID to 32-character format for backend API calls
 * This ensures compatibility with the database which stores IDs in 32-char format
 * 
 * @param id - The ID to convert (32 or 36 character format)
 * @returns 32-character ID without hyphens, or the original if already in correct format
 * 
 * @example
 * toBackendId('550e8400-e29b-41d4-a716-446655440000')
 * // Returns: '550e8400e29b41d4a716446655440000'
 * 
 * toBackendId('d4bc569e090acbbc17354bd3657adb4d')
 * // Returns: 'd4bc569e090acbbc17354bd3657adb4d' (already correct)
 */
export const toBackendId = (id: string | null | undefined): string | null => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  return removeHyphensFromUUID(id);
};

/**
 * Type guard for checking if a value is a non-null string
 */
export const isNonNullString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};
