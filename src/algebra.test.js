import { describe, it, expect } from 'vitest';
import {
  normalizeRational,
  addRationals,
  multiplyRational,
  divideRational,
  formatAlgebraicSide,
  formatSolution,
  winningConstant,
  resolveDrop,
} from './algebra.js';

describe('normalizeRational', () => {
  it('simplifies only when the numerator divides evenly', () => {
    expect(normalizeRational(4, 4)).toEqual({ num: 1, den: 1 });
    expect(normalizeRational(6, 2)).toEqual({ num: 3, den: 1 });
    expect(normalizeRational(-8, 2)).toEqual({ num: -4, den: 1 });
  });

  it('keeps 4/6 and -3/4 unreduced', () => {
    expect(normalizeRational(4, 6)).toEqual({ num: 4, den: 6 });
    expect(normalizeRational(-3, 4)).toEqual({ num: -3, den: 4 });
  });

  it('moves a negative denominator onto the numerator', () => {
    expect(normalizeRational(3, -4)).toEqual({ num: -3, den: 4 });
  });
});

describe('addRationals', () => {
  it('adds +2 and +3 into +5', () => {
    expect(addRationals(2, 1, 3, 1)).toEqual({ num: 5, den: 1 });
  });

  it('adds +5x and -2x into +3x', () => {
    expect(addRationals(5, 1, -2, 1)).toEqual({ num: 3, den: 1 });
  });
});

describe('multiplyRational and divideRational', () => {
  it('turns 4x ÷ 4 into 1x and -3 ÷ 4 into -3/4', () => {
    expect(divideRational(4, 1, 4)).toEqual({ num: 1, den: 1 });
    expect(divideRational(-3, 1, 4)).toEqual({ num: -3, den: 4 });
  });

  it('flips -x = 7 by multiplying by -1', () => {
    expect(multiplyRational(-1, 1, -1)).toEqual({ num: 1, den: 1 });
    expect(multiplyRational(7, 1, -1)).toEqual({ num: -7, den: 1 });
  });

  it('rejects division by zero', () => {
    expect(() => divideRational(1, 1, 0)).toThrow();
  });
});

describe('formatAlgebraicSide', () => {
  it('returns 0 for an empty side', () => {
    expect(formatAlgebraicSide([])).toBe('0');
  });

  it('writes compact terms without exploding them into units', () => {
    expect(
      formatAlgebraicSide([
        { kind: 'variable', num: 4, den: 1 },
      ])
    ).toBe('4x');
    expect(
      formatAlgebraicSide([
        { kind: 'constant', num: -3, den: 1 },
      ])
    ).toBe('-3');
    expect(
      formatAlgebraicSide([
        { kind: 'variable', num: 1, den: 1 },
        { kind: 'constant', num: 2, den: 1 },
      ])
    ).toBe('x + 2');
  });

  it('writes an unreduced fraction after a divide', () => {
    expect(
      formatAlgebraicSide([{ kind: 'constant', num: -3, den: 4 }])
    ).toBe('-3/4');
  });
});

describe('winningConstant', () => {
  it('accepts 4x = -3 after ÷ 4', () => {
    const constant = winningConstant(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: -3, den: 4 }]
    );
    expect(constant).toEqual({ kind: 'constant', num: -3, den: 4 });
    expect(formatSolution(constant)).toBe('x = -3/4');
  });

  it('accepts -x = 7 after × -1', () => {
    const constant = winningConstant(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: -7, den: 1 }]
    );
    expect(formatSolution(constant)).toBe('x = -7');
  });

  it('rejects two constants still sitting on one side', () => {
    expect(
      winningConstant(
        [{ kind: 'variable', num: 1, den: 1 }],
        [
          { kind: 'constant', num: 2, den: 1 },
          { kind: 'constant', num: 3, den: 1 },
        ]
      )
    ).toBeNull();
  });
});

describe('resolveDrop', () => {
  it('fuses +2 and +3 into +5', () => {
    const result = resolveDrop(
      { kind: 'constant', num: 2, den: 1 },
      { kind: 'constant', num: 3, den: 1 }
    );
    expect(result).toEqual({ action: 'fuse', num: 5, den: 1 });
  });

  it('cancels +5x onto -2x into +3x', () => {
    const result = resolveDrop(
      { kind: 'variable', num: 5, den: 1 },
      { kind: 'variable', num: -2, den: 1 }
    );
    expect(result).toEqual({ action: 'cancel', num: 3, den: 1 });
  });

  it('annihilates +3 and -3', () => {
    expect(
      resolveDrop(
        { kind: 'constant', num: 3, den: 1 },
        { kind: 'constant', num: -3, den: 1 }
      )
    ).toEqual({ action: 'annihilate' });
  });

  it('ignores a drop onto a different kind', () => {
    expect(
      resolveDrop(
        { kind: 'variable', num: 1, den: 1 },
        { kind: 'constant', num: 1, den: 1 }
      )
    ).toBeNull();
  });
});
