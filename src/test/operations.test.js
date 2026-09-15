import { describe, it, expect } from 'vitest';
import { Operation, Operand } from '../keys.js';
import { parseOpNumber, applyNumberToBothSides } from '../operations.js';

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
  it('accepts any non-zero number, including 1 and negatives', () => {
    expect(parseOpNumber('1')).toBe(1);
    expect(parseOpNumber('4')).toBe(4);
    expect(parseOpNumber('-1')).toBe(-1);
    expect(parseOpNumber('-2')).toBe(-2);
  });

  it('rejects zero and junk', () => {
    expect(parseOpNumber('0')).toBeNull();
    expect(parseOpNumber('abc')).toBeNull();
    expect(parseOpNumber('')).toBeNull();
  });
});

describe('applyNumberToBothSides', () => {
  it('divides 4x = -3 into x = -3/4', () => {
    const game = fakeGame(
      [{ kind: 'variable', num: 4, den: 1 }],
      [{ kind: 'constant', num: -3, den: 1 }]
    );
    expect(applyNumberToBothSides(game, Operation.DIVIDE, 4)).toBe(true);
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
});
