import { describe, it, expect } from 'vitest';
import {
  areOpposites,
  formatAlgebraicSide,
  countTokens,
  isIsolatedX,
} from './algebra.js';

describe('areOpposites', () => {
  it('matches +1 with -1 and +x with -x', () => {
    expect(areOpposites('+1', '-1')).toBe(true);
    expect(areOpposites('-x', '+x')).toBe(true);
    expect(areOpposites('+1', '+1')).toBe(false);
    expect(areOpposites('+x', '+1')).toBe(false);
  });
});

describe('formatAlgebraicSide', () => {
  it('returns 0 for an empty side', () => {
    expect(formatAlgebraicSide([])).toBe('0');
  });

  it('collapses tokens into a compact expression', () => {
    expect(formatAlgebraicSide([{ type: '+x' }, { type: '+1' }, { type: '+1' }])).toBe(
      'x + 2'
    );
    expect(formatAlgebraicSide([{ type: '-x' }, { type: '-1' }])).toBe('-x - 1');
    expect(formatAlgebraicSide([{ type: '+x' }, { type: '+x' }])).toBe('2x');
  });

  it('returns 0 when opposite tokens cancel', () => {
    expect(formatAlgebraicSide([{ type: '+1' }, { type: '-1' }])).toBe('0');
  });
});

describe('isIsolatedX', () => {
  it('detects x isolated against a constant', () => {
    const left = countTokens([{ type: '+x' }]);
    const right = countTokens([{ type: '+1' }, { type: '+1' }]);
    expect(isIsolatedX(left, right)).toBe(true);
  });

  it('rejects leftover variables on the other side', () => {
    const left = countTokens([{ type: '+x' }]);
    const right = countTokens([{ type: '+x' }, { type: '+1' }]);
    expect(isIsolatedX(left, right)).toBe(false);
  });
});
