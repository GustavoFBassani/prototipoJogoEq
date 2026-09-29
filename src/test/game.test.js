import { describe, it, expect, vi } from 'vitest';
import { Operation } from '../keys.js';
import { advanceFromWinModal, handleGameKeydown, resetCurrentLevel, stepOpValue, updateOpValueForOperand } from '../game.js';

function mockModal(active) {
  const classes = new Set(active ? ['active'] : []);
  return {
    inert: !active,
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
}

function mockGame({ modalActive = false, pendingOperation = null, currentLevelIndex = 0, operandValue = '1', operand = 'number' } = {}) {
  let checkedOperand = operand;
  return {
    currentLevelIndex,
    levels: [{}, {}],
    completedLevels: new Set(),
    pendingOperation,
    loadLevel: vi.fn(),
    els: {
      winModal: mockModal(modalActive),
      levelsModal: mockModal(false),
      customModal: mockModal(false),
      opNumberValue: { id: 'op-number-value', tagName: 'INPUT', isContentEditable: false, value: operandValue },
      opNumberNote: { hidden: true, textContent: '' },
      operandSelector: {
        hidden: false,
        querySelector: (selector) => {
          if (selector === 'input[name="operand"]:checked') {
            return { value: checkedOperand };
          }
          return null;
        },
      },
    },
    setOperand(op) {
      checkedOperand = op;
    },
  };
}

function keyEvent(key, target, extras = {}) {
  return {
    key,
    target,
    preventDefault: vi.fn(),
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...extras,
  };
}

describe('advanceFromWinModal', () => {
  it('does not change level when the win modal is closed', () => {
    const game = mockGame({ modalActive: false });
    expect(advanceFromWinModal(game)).toBe(false);
    expect(game.loadLevel).not.toHaveBeenCalled();
    expect(game.currentLevelIndex).toBe(0);
  });

  it('loads the next level when the win modal is open', () => {
    const game = mockGame({ modalActive: true });
    expect(advanceFromWinModal(game)).toBe(true);
    expect(game.loadLevel).toHaveBeenCalledWith(1);
  });
});

describe('resetCurrentLevel', () => {
  it('reloads the current level when no modal is open', () => {
    const game = mockGame({ currentLevelIndex: 1 });
    expect(resetCurrentLevel(game)).toBe(true);
    expect(game.loadLevel).toHaveBeenCalledWith(1);
  });

  it('does not reset while the win modal is open', () => {
    const game = mockGame({ modalActive: true, currentLevelIndex: 1 });
    expect(resetCurrentLevel(game)).toBe(false);
    expect(game.loadLevel).not.toHaveBeenCalled();
  });
});

describe('handleGameKeydown', () => {
  const board = { tagName: 'BODY', isContentEditable: false };

  it('does not load the next level on Enter while typing in an input', () => {
    const game = mockGame({ modalActive: true });
    const event = keyEvent('Enter', game.els.opNumberValue);
    handleGameKeydown(game, event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(game.loadLevel).not.toHaveBeenCalled();
  });

  it('loads the next level on Enter when the win modal is open', () => {
    const game = mockGame({ modalActive: true });
    const event = keyEvent('Enter', board);
    handleGameKeydown(game, event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(game.loadLevel).toHaveBeenCalledWith(1);
  });

  it('does not advance on Enter when the win modal is closed', () => {
    const game = mockGame({ modalActive: false });
    const event = keyEvent('Enter', board);
    handleGameKeydown(game, event);
    expect(game.loadLevel).not.toHaveBeenCalled();
  });

  it('reloads the current level on R', () => {
    const game = mockGame({ currentLevelIndex: 1 });
    const event = keyEvent('R', board);
    handleGameKeydown(game, event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(game.loadLevel).toHaveBeenCalledWith(1);
  });

  it('reloads the current level on r', () => {
    const game = mockGame({ currentLevelIndex: 1 });
    const event = keyEvent('r', board);
    handleGameKeydown(game, event);
    expect(game.loadLevel).toHaveBeenCalledWith(1);
  });

  it('does not reset on R while typing', () => {
    const game = mockGame({ currentLevelIndex: 1 });
    const event = keyEvent('r', game.els.opNumberValue);
    handleGameKeydown(game, event);
    expect(game.loadLevel).not.toHaveBeenCalled();
  });

  it('does not reset on Ctrl+R', () => {
    const game = mockGame({ currentLevelIndex: 1 });
    const event = keyEvent('r', board, { ctrlKey: true });
    handleGameKeydown(game, event);
    expect(game.loadLevel).not.toHaveBeenCalled();
  });
});

describe('stepOpValue and updateOpValueForOperand', () => {
  it('increases and decreases numbers correctly', () => {
    const game = mockGame({ operandValue: '1', operand: 'number' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('2');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('3');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('2');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('1');
  });

  it('increases and decreases x terms correctly (x -> 2x -> 3x -> 2x -> x)', () => {
    const game = mockGame({ operandValue: 'x', operand: 'unknown' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('2x');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('3x');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('4x');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('3x');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('2x');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('x');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('x');
  });

  it('switches between number and x correctly', () => {
    const game = mockGame({ operandValue: '1', operand: 'number' });
    game.setOperand('unknown');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('x');

    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('2x');

    game.setOperand('number');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('2');

    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('3');

    game.setOperand('unknown');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('3x');
  });

  it('steps and formats values for ADD (+1 -> +2 -> +3, and +x -> +2x)', () => {
    const game = mockGame({ pendingOperation: Operation.ADD, operandValue: '+1', operand: 'number' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('+2');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('+3');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('+2');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('+1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('+1');

    game.setOperand('unknown');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('+x');

    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('+2x');

    game.setOperand('number');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('+2');
  });

  it('steps and formats values for SUBTRACT (-1 -> -2 -> -3, and -x -> -2x)', () => {
    const game = mockGame({ pendingOperation: Operation.SUBTRACT, operandValue: '-1', operand: 'number' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('-2');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('-3');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('-2');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('-1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('-1');

    game.setOperand('unknown');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('-x');

    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('-2x');

    game.setOperand('number');
    updateOpValueForOperand(game);
    expect(game.els.opNumberValue.value).toBe('-2');
  });

  it('steps and formats values for MULTIPLY (×2 -> ×3 -> ×2)', () => {
    const game = mockGame({ pendingOperation: Operation.MULTIPLY, operandValue: '×2', operand: 'number' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('×3');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('×2');
  });

  it('steps and formats values for DIVIDE (÷2 -> ÷3 -> ÷2)', () => {
    const game = mockGame({ pendingOperation: Operation.DIVIDE, operandValue: '÷2', operand: 'number' });
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('÷3');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('÷2');
  });
});
