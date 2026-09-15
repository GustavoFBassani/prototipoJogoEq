import { describe, it, expect, vi } from 'vitest';
import { Operation, Operand } from '../keys.js';
import { parseOpNumber, applyNumberToBothSides } from '../operations.js';

describe('parseOpNumber', () => {
  it('accepts 1 when adding or subtracting', () => {
    expect(parseOpNumber('1', Operation.ADD)).toBe(1);
    expect(parseOpNumber('1', Operation.SUBTRACT)).toBe(1);
  });

  it('accepts integers greater than 1', () => {
    expect(parseOpNumber('2', Operation.ADD)).toBe(2);
    expect(parseOpNumber('10', Operation.MULTIPLY)).toBe(10);
  });

  it('rejects 1 for multiply and divide', () => {
    expect(parseOpNumber('1', Operation.MULTIPLY)).toBeNull();
    expect(parseOpNumber('1', Operation.DIVIDE)).toBeNull();
  });

  it('rejects zero, negatives, and junk', () => {
    expect(parseOpNumber('0', Operation.ADD)).toBeNull();
    expect(parseOpNumber('-2', Operation.ADD)).toBeNull();
    expect(parseOpNumber('abc', Operation.ADD)).toBeNull();
    expect(parseOpNumber('', Operation.ADD)).toBeNull();
  });
});

function makeGame(lhsTypes, rhsTypes) {
  return {
    lhsItems: lhsTypes.map((type, index) => ({ id: index + 1, type })),
    rhsItems: rhsTypes.map((type, index) => ({ id: 100 + index, type })),
    itemIdCounter: 200,
    sound: { playAddOperation: vi.fn() },
    showOpNote: vi.fn(),
    renderAll: vi.fn(),
    checkWin: vi.fn(),
  };
}

function typesOf(items) {
  return items.map((item) => item.type);
}

describe('applyNumberToBothSides', () => {
  it('adds number tokens to both sides', () => {
    const game = makeGame(['+x'], ['+1']);
    applyNumberToBothSides(game, Operation.ADD, 2, Operand.NUMBER);
    expect(typesOf(game.lhsItems)).toEqual(['+x', '+1', '+1']);
    expect(typesOf(game.rhsItems)).toEqual(['+1', '+1', '+1']);
  });

  it('adds unknown tokens to both sides', () => {
    const game = makeGame(['+x'], ['+1']);
    applyNumberToBothSides(game, Operation.ADD, 2, Operand.UNKNOWN);
    expect(typesOf(game.lhsItems)).toEqual(['+x', '+x', '+x']);
    expect(typesOf(game.rhsItems)).toEqual(['+1', '+x', '+x']);
  });

  it('subtracts unknown tokens from both sides', () => {
    const game = makeGame(['+x'], ['+1']);
    applyNumberToBothSides(game, Operation.SUBTRACT, 1, Operand.UNKNOWN);
    expect(typesOf(game.lhsItems)).toEqual(['+x', '-x']);
    expect(typesOf(game.rhsItems)).toEqual(['+1', '-x']);
  });
});
