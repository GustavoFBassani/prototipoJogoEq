import { describe, it, expect, vi } from 'vitest';
import { Operation } from '../keys.js';
import { scoreForSteps } from '../win.js';
import { advanceFromWinModal, beginOperation, captionText, handleGameKeydown, hintButtonVisible, hintUsesHtml, optimizedCustomSteps, resetCurrentLevel, stepOpValue, updateOpValueForOperand } from '../game.js';

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
    [Operation.ADD, 'Somar o quê?', '+1', false],
    [Operation.SUBTRACT, 'Subtrair o quê?', '-1', false],
    [Operation.MULTIPLY, 'Multiplicar por?', '×2', true],
    [Operation.DIVIDE, 'Dividir por?', '÷2', true],
  ])('sets the prompt for %s', (operation, text, value, numberOnly) => {
    const game = mockOpGame();
    beginOperation(game, operation);
    expect(game.els.operandLegend.textContent).toBe(text);
    expect(game.els.opNumberValue.value).toBe(value);
    expect(game.els.opNumberValue.focus).toHaveBeenCalledOnce();
    expect(game.els.opNumberValue.select).toHaveBeenCalledOnce();
    expect(game.els.operandSelector.hidden).toBe(false);
    expect(game.els.operandSelector.classList.contains('is-number-only')).toBe(numberOnly);
  });

  it('does not focus the operation field automatically on touch devices', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    const game = mockOpGame();

    beginOperation(game, Operation.ADD);

    expect(game.els.opNumberValue.focus).not.toHaveBeenCalled();
    expect(game.els.opNumberValue.select).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
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

  it('steps multiply factors through negative values without allowing zero', () => {
    const game = mockGame({ pendingOperation: Operation.MULTIPLY, operandValue: '2' });
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('×1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('×-1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('×-2');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('×-1');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('×1');
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

describe('scoreForSteps', () => {
  it('awards 100 points at or below the optimized minimum and deducts 10 per extra step', () => {
    expect(scoreForSteps(4, 4)).toBe(100);
    expect(scoreForSteps(3, 4)).toBe(100);
    expect(scoreForSteps(5, 4)).toBe(90);
    expect(scoreForSteps(20, 4)).toBe(0);
  });

  it('does not report a score when the optimized minimum is unknown', () => {
    expect(scoreForSteps(4, undefined)).toBeNull();
  });
});

describe('optimizedCustomSteps', () => {
  it('counts operations, required term reductions, and division for a free equation', () => {
    expect(optimizedCustomSteps(2, 3, 1, 5)).toBe(6);
    expect(optimizedCustomSteps(4, 0, 0, 8)).toBe(1);
  });
});

describe('activity mode helpers', () => {
  const activityGame = {
    activity: true,
    activityName: 'Turma 7A',
    levels: [
      { title: 'Aquecimento', hint: '<b>tira</b> o 3' },
      { title: 'Sem dica', hint: '   ' },
    ],
  };
  const campaignGame = {
    activity: false,
    levels: [{ title: 'Fase 1', hint: 'Use <b>÷</b>' }],
  };

  it('writes activity hints as plain text', () => {
    expect(hintUsesHtml(activityGame)).toBe(false);
  });

  it('hides the hint button when the activity hint is blank', () => {
    expect(hintButtonVisible(activityGame, 0)).toBe(true);
    expect(hintButtonVisible(activityGame, 1)).toBe(false);
  });

  it('keeps HTML hints and the hint button in campaign', () => {
    expect(hintUsesHtml(campaignGame)).toBe(true);
    expect(hintButtonVisible(campaignGame, 0)).toBe(true);
  });

  it('captions activity phases with name and title', () => {
    expect(captionText(activityGame, 0)).toBe('Turma 7A · Aquecimento');
    expect(captionText(activityGame, 1)).toBe('Turma 7A · Sem dica');
  });

  it('leaves the caption empty in campaign', () => {
    expect(captionText(campaignGame, 0)).toBe('');
  });
});
