import { describe, it, expect } from 'vitest';
import { ensureUUID, isValidUUID } from '@/lib/uuid';

describe('UUID Payload Validation (RPC guard)', () => {
  it('should pass a valid UUID v4', () => {
    const validUUID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    expect(isValidUUID(validUUID)).toBe(true);
    expect(ensureUUID(validUUID)).toBe(validUUID);
  });

  it('should return null for an invalid string (random text)', () => {
    const invalidString = 'not-a-uuid-at-all';
    expect(isValidUUID(invalidString)).toBe(false);
    expect(ensureUUID(invalidString)).toBe(null);
  });

  it('should return null for an empty string', () => {
    const emptyString = '';
    expect(isValidUUID(emptyString)).toBe(false);
    expect(ensureUUID(emptyString)).toBe(null);
  });

  it('should return null for whitespace-only strings', () => {
    const whitespaceString = '   ';
    expect(isValidUUID(whitespaceString)).toBe(false);
    expect(ensureUUID(whitespaceString)).toBe(null);
  });

  it('should return a trimmed valid UUID', () => {
    const paddedUUID = '  f81d4fae-7dec-11d0-a765-00a0c91e6bf6  ';
    expect(ensureUUID(paddedUUID)).toBe('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
  });

  it('should return null for null or undefined', () => {
    expect(ensureUUID(null)).toBe(null);
    expect(ensureUUID(undefined)).toBe(null);
  });
});
