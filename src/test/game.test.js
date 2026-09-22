import { describe, it, expect, vi } from 'vitest';
import { advanceFromWinModal, beginOperation, handleGameKeydown, resetCurrentLevel } from '../game.js';
import { Operation } from '../keys.js';

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

function mockGame({ modalActive = false, pendingOperation = null, currentLevelIndex = 0 } = {}) {
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
      opNumberValue: { id: 'op-number-value', tagName: 'INPUT', isContentEditable: false },
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

function mockOpGame() {
  const classes = new Set();
  return {
    pendingOperation: null,
    els: {
      opsPanel: { classList: { add: vi.fn(), remove: vi.fn() } },
      opNumberPanel: { hidden: true },
      operandSelector: {
        hidden: true,
        classList: {
          toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
          contains: (name) => classes.has(name),
        },
      },
      operandLegend: { textContent: '' },
      operandNumber: { checked: false },
      opNumberValue: { value: '', focus: vi.fn(), select: vi.fn() },
      opNumberNote: { hidden: true, textContent: '' },
    },
  };
}

describe('beginOperation', () => {
  it.each([
    [Operation.ADD, 'Somar o quê?', '1', false],
    [Operation.SUBTRACT, 'Subtrair o quê?', '1', false],
    [Operation.MULTIPLY, 'Multiplicar o quê?', '2', true],
    [Operation.DIVIDE, 'Dividir o quê?', '2', true],
  ])('sets the prompt for %s', (operation, text, value, numberOnly) => {
    const game = mockOpGame();
    beginOperation(game, operation);
    expect(game.els.operandLegend.textContent).toBe(text);
    expect(game.els.opNumberValue.value).toBe(value);
    expect(game.els.operandSelector.hidden).toBe(false);
    expect(game.els.operandSelector.classList.contains('is-number-only')).toBe(numberOnly);
  });
});

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
