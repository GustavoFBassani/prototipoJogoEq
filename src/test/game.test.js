import { describe, it, expect, vi } from 'vitest';
import { Operation } from '../keys.js';
import { scoreForSteps } from '../win.js';
import {
  advanceFromWinModal,
  beginOperation,
  calculateTutorialPosition,
  captionText,
  closeTutorial,
  handleGameKeydown,
  hasSeenTutorial,
  hintButtonVisible,
  hintUsesHtml,
  optimizedCustomSteps,
  resetCurrentLevel,
  setTutorialSeen,
  showTutorialStep,
  stepOpValue,
  TUTORIAL_SEEN_STORAGE_KEY,
  TUTORIAL_STEPS,
  toggleHint,
  updateOpValueForOperand,
} from '../game.js';

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

function mockGame({ modalActive = false, tutorialActive = false, pendingOperation = null, currentLevelIndex = 0, operandValue = '1', operand = 'number' } = {}) {
  let checkedOperand = operand;
  return {
    currentLevelIndex,
    levels: [{}, {}],
    completedLevels: new Set(),
    pendingOperation,
    loadLevel: vi.fn(),
    tutor: { hush: vi.fn() },
    els: {
      winModal: mockModal(modalActive),
      levelsModal: mockModal(false),
      customModal: mockModal(false),
      tutorialModal: mockModal(tutorialActive),
      tutorialCard: { style: {} },
      tutorialProgress: { textContent: '' },
      tutorialStepText: { textContent: '' },
      btnPreviousTutorial: { hidden: false },
      btnNextTutorial: { hidden: false },
      btnCloseTutorial: { hidden: false },
      btnSkipTutorial: { hidden: false },
      btnSkipTutorialIcon: { hidden: false },
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

  it('clears recorded phase scores when restarting after final completion', () => {
    const game = mockGame({ modalActive: true });
    game.completedLevels = new Set([0, 1]);
    game.levelScores = new Map([[0, 80], [1, 90]]);

    expect(advanceFromWinModal(game)).toBe(true);

    expect(game.completedLevels.size).toBe(0);
    expect(game.levelScores.size).toBe(0);
    expect(game.loadLevel).toHaveBeenCalledWith(0);
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

  it('steps divide values through negative values without allowing zero', () => {
    const game = mockGame({ pendingOperation: Operation.DIVIDE, operandValue: '2' });
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('÷1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('÷-1');
    stepOpValue(game, -1);
    expect(game.els.opNumberValue.value).toBe('÷-2');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('÷-1');
    stepOpValue(game, 1);
    expect(game.els.opNumberValue.value).toBe('÷1');
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

describe('toggleHint', () => {
  it('counts the first hint click as one step and ignores later clicks', () => {
    const game = {
      levels: [{ hint: 'Tire o 2 dos dois lados.' }],
      currentLevelIndex: 0,
      activity: false,
      hintOpen: false,
      hintUsedThisLevel: false,
      recordStep: vi.fn(),
      tutor: { speakHint: vi.fn(), hush: vi.fn() },
      els: {
        instructionHint: { hidden: true, style: {}, offsetWidth: 0 },
        btnHint: { setAttribute: vi.fn() },
      },
    };

    toggleHint(game);
    expect(game.recordStep).toHaveBeenCalledOnce();
    expect(game.hintOpen).toBe(true);
    expect(game.tutor.speakHint).toHaveBeenCalledWith('Tire o 2 dos dois lados.');

    toggleHint(game);
    toggleHint(game);
    expect(game.recordStep).toHaveBeenCalledOnce();
    expect(game.hintOpen).toBe(true);
    expect(game.tutor.speakHint).toHaveBeenCalledTimes(2);
    expect(game.tutor.hush).toHaveBeenCalledOnce();
  });
});

function createMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => map.get(key) ?? null),
    setItem: vi.fn((key, value) => map.set(key, String(value))),
    removeItem: vi.fn((key) => map.delete(key)),
  };
}

describe('calculateTutorialPosition', () => {
  it('centers the card when targetRect is missing or has zero dimensions', () => {
    const pos = calculateTutorialPosition({
      targetRect: null,
      cardWidth: 400,
      cardHeight: 200,
      viewportWidth: 1000,
      viewportHeight: 800,
      margin: 16,
    });
    expect(pos).toEqual({ left: 300, top: 300, placement: 'center' });
  });

  it('places the card below when target is in the upper half and fits below without overlap', () => {
    const targetRect = { top: 60, bottom: 120, left: 450, right: 750, width: 300, height: 60 };
    const pos = calculateTutorialPosition({
      targetRect,
      cardWidth: 400,
      cardHeight: 200,
      viewportWidth: 1200,
      viewportHeight: 800,
      gap: 18,
      margin: 16,
    });
    expect(pos.placement).toBe('below');
    expect(pos.top).toBe(138); // 120 + 18
    expect(pos.left).toBe(400); // centered horizontally: 600 - 200
    expect(pos.top).toBeGreaterThanOrEqual(targetRect.bottom);
  });

  it('places the card above when target is in the lower half and fits above without overlap', () => {
    const targetRect = { top: 560, bottom: 680, left: 300, right: 900, width: 600, height: 120 };
    const pos = calculateTutorialPosition({
      targetRect,
      cardWidth: 400,
      cardHeight: 200,
      viewportWidth: 1200,
      viewportHeight: 800,
      gap: 18,
      margin: 16,
    });
    expect(pos.placement).toBe('above');
    expect(pos.top).toBe(342); // 560 - 18 - 200
    expect(pos.left).toBe(400); // 600 - 200
    expect(pos.top + 200).toBeLessThanOrEqual(targetRect.top);
  });

  it('places the card to the side when vertical space is constrained', () => {
    const targetRect = { top: 100, bottom: 400, left: 350, right: 650, width: 300, height: 300 };
    const pos = calculateTutorialPosition({
      targetRect,
      cardWidth: 300,
      cardHeight: 180,
      viewportWidth: 1000,
      viewportHeight: 500,
      gap: 18,
      margin: 16,
    });
    expect(pos.placement).toBe('right');
    expect(pos.left).toBe(668); // 650 + 18
    expect(pos.left).toBeGreaterThanOrEqual(targetRect.right);
  });

  it('clamps coordinates to stay within screen margins', () => {
    const targetRect = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
    const pos = calculateTutorialPosition({
      targetRect,
      cardWidth: 400,
      cardHeight: 200,
      viewportWidth: 500,
      viewportHeight: 400,
      gap: 18,
      margin: 16,
    });
    expect(pos.left).toBe(16);
    expect(pos.top).toBe(58);
  });
});

describe('hasSeenTutorial and setTutorialSeen', () => {
  it('returns false when storage is null or key is missing', () => {
    expect(hasSeenTutorial(null)).toBe(false);
    const storage = createMockStorage();
    expect(hasSeenTutorial(storage)).toBe(false);
  });

  it('returns true when storage has key equal to "true"', () => {
    const storage = createMockStorage({ [TUTORIAL_SEEN_STORAGE_KEY]: 'true' });
    expect(hasSeenTutorial(storage)).toBe(true);
  });

  it('sets and removes tutorial seen status in storage', () => {
    const storage = createMockStorage();
    setTutorialSeen(storage, true);
    expect(storage.setItem).toHaveBeenCalledWith(TUTORIAL_SEEN_STORAGE_KEY, 'true');
    expect(hasSeenTutorial(storage)).toBe(true);

    setTutorialSeen(storage, false);
    expect(storage.removeItem).toHaveBeenCalledWith(TUTORIAL_SEEN_STORAGE_KEY);
    expect(hasSeenTutorial(storage)).toBe(false);
  });

  it('safely catches storage exceptions without throwing', () => {
    const brokenStorage = {
      getItem() { throw new Error('SecurityError: blocked'); },
      setItem() { throw new Error('QuotaExceededError'); },
      removeItem() { throw new Error('Blocked'); },
    };
    expect(hasSeenTutorial(brokenStorage)).toBe(false);
    expect(() => setTutorialSeen(brokenStorage, true)).not.toThrow();
  });
});

describe('tutorial modal skip and close', () => {
  it('closes tutorial and marks it as seen in storage', () => {
    const storage = createMockStorage();
    const game = mockGame({ tutorialActive: true });
    game.storage = storage;
    closeTutorial(game);

    expect(game.els.tutorialModal.classList.contains('active')).toBe(false);
    expect(game.els.tutorialModal.inert).toBe(true);
    expect(game.tutor.hush).toHaveBeenCalled();
    expect(storage.setItem).toHaveBeenCalledWith(TUTORIAL_SEEN_STORAGE_KEY, 'true');
  });

  it('closes tutorial when Escape key is pressed', () => {
    const storage = createMockStorage();
    const game = mockGame({ tutorialActive: true });
    game.storage = storage;
    const event = keyEvent('Escape', { tagName: 'BODY' });

    handleGameKeydown(game, event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(game.els.tutorialModal.classList.contains('active')).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith(TUTORIAL_SEEN_STORAGE_KEY, 'true');
  });

  it('configures skip button visibility on tutorial steps', () => {
    const game = mockGame({ tutorialActive: true });

    // Step 0: skip should be visible
    showTutorialStep(game, 0);
    expect(game.els.btnSkipTutorial.hidden).toBe(false);
    expect(game.els.btnPreviousTutorial.hidden).toBe(true);
    expect(game.els.btnNextTutorial.hidden).toBe(false);
    expect(game.els.btnCloseTutorial.hidden).toBe(true);

    // Step 1: skip should be visible
    showTutorialStep(game, 1);
    expect(game.els.btnSkipTutorial.hidden).toBe(false);
    expect(game.els.btnPreviousTutorial.hidden).toBe(false);
    expect(game.els.btnNextTutorial.hidden).toBe(false);
    expect(game.els.btnCloseTutorial.hidden).toBe(true);

    // Last step: skip should be hidden (Começar is shown)
    showTutorialStep(game, TUTORIAL_STEPS.length - 1);
    expect(game.els.btnSkipTutorial.hidden).toBe(true);
    expect(game.els.btnNextTutorial.hidden).toBe(true);
    expect(game.els.btnCloseTutorial.hidden).toBe(false);
  });
});
