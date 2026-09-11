import { describe, it, expect } from 'vitest';
import { parseOpNumber } from './operations.js';

describe('parseOpNumber', () => {
  it('accepts integers greater than 1', () => {
    expect(parseOpNumber('2')).toBe(2);
    expect(parseOpNumber('10')).toBe(10);
  });

  it('rejects 1, zero, negatives, and junk', () => {
    expect(parseOpNumber('1')).toBeNull();
    expect(parseOpNumber('0')).toBeNull();
    expect(parseOpNumber('-2')).toBeNull();
    expect(parseOpNumber('abc')).toBeNull();
    expect(parseOpNumber('')).toBeNull();
  });
});
