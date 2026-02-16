
import { isChecklistChecked } from './checklist-utils';
import { describe, it, expect } from 'vitest';

describe('isChecklistChecked', () => {
  it('should return true for boolean true', () => {
    expect(isChecklistChecked(true)).toBe(true);
  });

  it('should return true for string "true"', () => {
    expect(isChecklistChecked('true')).toBe(true);
  });

  it('should return false for boolean false', () => {
    expect(isChecklistChecked(false)).toBe(false);
  });

  it('should return false for string "false"', () => {
    expect(isChecklistChecked('false')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isChecklistChecked(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isChecklistChecked(null)).toBe(false);
  });
});
