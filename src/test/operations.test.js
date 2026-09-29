import { describe, it, expect } from 'vitest';
import { Operation, Operand } from '../keys.js';
import { parseOpNumber, formatOpDisplay, applyNumberToBothSides } from '../operations.js';

function fakeGame(lhs, rhs) {
  return {
    lhsItems: lhs.map((item, i) => ({ id: i + 1, ...item })),
    rhsItems: rhs.map((item, i) => ({ id: 100 + i, ...item })),
    itemIdCounter: 200,
    sound: { playAddOperation() {} },
    particles: { createDustExplosion() {} },
    renderAll() {},
    showOpNote() {},
  };
}

describe('parseOpNumber', () => {
  it('accepts any non-zero number, including 1, signed, and unicode minus', () => {
    expect(parseOpNumber('1')).toBe(1);
    expect(parseOpNumber('+1')).toBe(1);
    expect(parseOpNumber('4')).toBe(4);
    expect(parseOpNumber('-1')).toBe(-1);
    expect(parseOpNumber('−1')).toBe(-1);
    expect(parseOpNumber('-2')).toBe(-2);
  });

  it('accepts variable x terms and extracts the coefficient', () => {
    expect(parseOpNumber('x')).toBe(1);
    expect(parseOpNumber('+x')).toBe(1);
    expect(parseOpNumber('2x')).toBe(2);
    expect(parseOpNumber('3x')).toBe(3);
    expect(parseOpNumber('-x')).toBe(-1);
    expect(parseOpNumber('−x')).toBe(-1);
    expect(parseOpNumber('-4x')).toBe(-4);
  });

  it('accepts multiply and divide prefixed expressions', () => {
    expect(parseOpNumber('×2')).toBe(2);
    expect(parseOpNumber('*2')).toBe(2);
    expect(parseOpNumber('·2')).toBe(2);
    expect(parseOpNumber('×-1')).toBe(-1);
    expect(parseOpNumber('÷2')).toBe(2);
    expect(parseOpNumber('/2')).toBe(2);
    expect(parseOpNumber('÷-1')).toBe(-1);
  });

  it('rejects zero, zero x, and junk', () => {
    expect(parseOpNumber('0')).toBeNull();
    expect(parseOpNumber('0x')).toBeNull();
    expect(parseOpNumber('-0x')).toBeNull();
    expect(parseOpNumber('+0x')).toBeNull();
    expect(parseOpNumber('×0')).toBeNull();
    expect(parseOpNumber('÷0')).toBeNull();
    expect(parseOpNumber('abc')).toBeNull();
    expect(parseOpNumber('')).toBeNull();
  });
});

describe('formatOpDisplay', () => {
  it('formats unknown operand as x, 2x, 3x etc. when no operation is specified', () => {
    expect(formatOpDisplay(1, Operand.UNKNOWN)).toBe('x');
    expect(formatOpDisplay(2, Operand.UNKNOWN)).toBe('2x');
    expect(formatOpDisplay(3, Operand.UNKNOWN)).toBe('3x');
    expect(formatOpDisplay(4, Operand.UNKNOWN)).toBe('4x');
    expect(formatOpDisplay(-1, Operand.UNKNOWN)).toBe('-x');
    expect(formatOpDisplay(-2, Operand.UNKNOWN)).toBe('-2x');
  });

  it('formats number operand as plain numbers when no operation is specified', () => {
    expect(formatOpDisplay(1, Operand.NUMBER)).toBe('1');
    expect(formatOpDisplay(2, Operand.NUMBER)).toBe('2');
    expect(formatOpDisplay(5, Operand.NUMBER)).toBe('5');
  });

  it('converts across operands from string input', () => {
    expect(formatOpDisplay('1', Operand.UNKNOWN)).toBe('x');
    expect(formatOpDisplay('3', Operand.UNKNOWN)).toBe('3x');
    expect(formatOpDisplay('x', Operand.NUMBER)).toBe('1');
    expect(formatOpDisplay('3x', Operand.NUMBER)).toBe('3');
  });

  it('formats ADD with + sign for numbers and variables', () => {
    expect(formatOpDisplay(1, Operand.NUMBER, Operation.ADD)).toBe('+1');
    expect(formatOpDisplay(2, Operand.NUMBER, Operation.ADD)).toBe('+2');
    expect(formatOpDisplay(1, Operand.UNKNOWN, Operation.ADD)).toBe('+x');
    expect(formatOpDisplay(2, Operand.UNKNOWN, Operation.ADD)).toBe('+2x');
    expect(formatOpDisplay('+1', Operand.UNKNOWN, Operation.ADD)).toBe('+x');
    expect(formatOpDisplay('+x', Operand.NUMBER, Operation.ADD)).toBe('+1');
  });

  it('formats SUBTRACT with - sign for numbers and variables', () => {
    expect(formatOpDisplay(1, Operand.NUMBER, Operation.SUBTRACT)).toBe('-1');
    expect(formatOpDisplay(2, Operand.NUMBER, Operation.SUBTRACT)).toBe('-2');
    expect(formatOpDisplay(1, Operand.UNKNOWN, Operation.SUBTRACT)).toBe('-x');
    expect(formatOpDisplay(2, Operand.UNKNOWN, Operation.SUBTRACT)).toBe('-2x');
    expect(formatOpDisplay('-1', Operand.UNKNOWN, Operation.SUBTRACT)).toBe('-x');
    expect(formatOpDisplay('-x', Operand.NUMBER, Operation.SUBTRACT)).toBe('-1');
    expect(formatOpDisplay('-2x', Operand.NUMBER, Operation.SUBTRACT)).toBe('-2');
  });

  it('formats MULTIPLY and DIVIDE with × and ÷ symbols', () => {
    expect(formatOpDisplay(2, Operand.NUMBER, Operation.MULTIPLY)).toBe('×2');
    expect(formatOpDisplay(3, Operand.NUMBER, Operation.MULTIPLY)).toBe('×3');
    expect(formatOpDisplay(-1, Operand.NUMBER, Operation.MULTIPLY)).toBe('×-1');
    expect(formatOpDisplay(2, Operand.NUMBER, Operation.DIVIDE)).toBe('÷2');
    expect(formatOpDisplay(4, Operand.NUMBER, Operation.DIVIDE)).toBe('÷4');
    expect(formatOpDisplay(-1, Operand.NUMBER, Operation.DIVIDE)).toBe('÷-1');
  });
});

describe('applyNumberToBothSides', () => {
  it('divides 4x = -3 into x = -3/4', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 4, den: 1 }],
      [{ kind: 'constant', num: -3, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.DIVIDE, 4)).toBe(true);
    expect(game.stepCount).toBe(1);
    expect(game.lhsItems[0]).toMatchObject({ kind: 'variable', num: 1, den: 1 });
    expect(game.rhsItems[0]).toMatchObject({ kind: 'constant', num: -3, den: 4 });
  });

  it('multiplies -x = 7 by -1 into x = -7', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: -1, den: 1 }],
      [{ kind: 'constant', num: 7, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.MULTIPLY, -1)).toBe(true);
    expect(game.lhsItems[0]).toMatchObject({ kind: 'variable', num: 1, den: 1 });
    expect(game.rhsItems[0]).toMatchObject({ kind: 'constant', num: -7, den: 1 });
  });

  it('adds +3 to both sides as one constant each', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: 2, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.ADD, 3, Operand.NUMBER)).toBe(true);
    expect(game.stepCount).toBe(1);
    expect(game.lhsItems).toHaveLength(2);
    expect(game.lhsItems[1]).toMatchObject({ kind: 'constant', num: 3, den: 1 });
    expect(game.rhsItems[1]).toMatchObject({ kind: 'constant', num: 3, den: 1 });
  });

  it('adds +2x to both sides as one variable each', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: 2, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.ADD, 2, Operand.UNKNOWN)).toBe(true);
    expect(game.lhsItems[1]).toMatchObject({ kind: 'variable', num: 2, den: 1 });
    expect(game.rhsItems[1]).toMatchObject({ kind: 'variable', num: 2, den: 1 });
  });

  it('subtracts x from both sides as one -x each', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: 2, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.SUBTRACT, 1, Operand.UNKNOWN)).toBe(true);
    expect(game.lhsItems[1]).toMatchObject({ kind: 'variable', num: -1, den: 1 });
    expect(game.rhsItems[1]).toMatchObject({ kind: 'variable', num: -1, den: 1 });
  });

  it('subtracts number or x correctly even if n is negative (e.g. parsed from -1 or -x)', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 1, den: 1 }],
      [{ kind: 'constant', num: 2, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.SUBTRACT, -1, Operand.NUMBER)).toBe(true);
    expect(game.lhsItems[1]).toMatchObject({ kind: 'constant', num: -1, den: 1 });
    expect(game.rhsItems[1]).toMatchObject({ kind: 'constant', num: -1, den: 1 });

    expect(applyNumberToBothSides(game, Operation.SUBTRACT, -2, Operand.UNKNOWN)).toBe(true);
    expect(game.lhsItems[2]).toMatchObject({ kind: 'variable', num: -2, den: 1 });
    expect(game.rhsItems[2]).toMatchObject({ kind: 'variable', num: -2, den: 1 });
  });
});
