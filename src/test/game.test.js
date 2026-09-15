import { describe, it, expect, vi } from 'vitest';
import { advanceFromWinModal, handleGameKeydown } from '../game.js';

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

function mockGame({ modalActive, pendingOperation = null } = {}) {
  return {
    currentLevelIndex: 0,
    levels: [{}, {}],
    completedLevels: new Set(),
    pendingOperation,
    loadLevel: vi.fn(),
    els: {
      winModal: mockModal(modalActive),
      opNumberValue: { id: 'op-number-value', tagName: 'INPUT', isContentEditable: false },
    },
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

describe('handleGameKeydown', () => {
  it('does not load the next level on Enter after the win modal opens', () => {
    const game = mockGame({ modalActive: true });
    const event = {
      key: 'Enter',
      target: game.els.opNumberValue,
      preventDefault: vi.fn(),
    };
    handleGameKeydown(game, event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(game.loadLevel).not.toHaveBeenCalled();
  });
});
