import { LEVELS } from './levels.js';
import { renderAll, renderLevelsPicker } from './render.js';
import { applyOperationBothSides, applyNumberToBothSides, parseOpNumber, formatOpDisplay } from './operations.js';
import { checkWinCondition } from './win.js';
import { Operation, Operand, operationFromKey, operationWithOperand, isTypingTarget, isResetKey, isNextLevelKey, hasKeyModifier } from './keys.js';

function queryEls() {
  return {
    dropzoneLhs: document.getElementById('dropzone-lhs'),
    dropzoneRhs: document.getElementById('dropzone-rhs'),
    mathLhs: document.getElementById('math-lhs'),
    mathRhs: document.getElementById('math-rhs'),
    mathFormulaWrapper: document.querySelector('.math-formula-wrapper'),
    levelLabel: document.getElementById('current-level-label'),
    instructionHint: document.getElementById('instruction-hint'),
    winModal: document.getElementById('win-modal'),
    winSolText: document.getElementById('win-sol-text'),
    levelsModal: document.getElementById('levels-modal'),
    levelsGrid: document.getElementById('levels-grid'),
    customModal: document.getElementById('custom-modal'),
    creditsModal: document.getElementById('credits-modal'),
    opsPanel: document.querySelector('.operations-panel'),
    opNumberPanel: document.getElementById('op-number-panel'),
    opNumberValue: document.getElementById('op-number-value'),
    opNumberNote: document.getElementById('op-number-note'),
    customEqNote: document.getElementById('custom-eq-note'),
    operandSelector: document.getElementById('operand-selector'),
    operandLegend: document.getElementById('operand-legend'),
    operandNumber: document.getElementById('operand-number'),
    operandUnknown: document.getElementById('operand-unknown'),
    btnOpNumberOk: document.getElementById('btn-op-number-ok'),
    btnOpNumberCancel: document.getElementById('btn-op-number-cancel'),
    btnOpStepUp: document.getElementById('btn-op-step-up'),
    btnOpStepDown: document.getElementById('btn-op-step-down'),
    btnSound: document.getElementById('btn-sound'),
    btnCredits: document.getElementById('btn-credits'),
    btnCloseCredits: document.getElementById('btn-close-credits'),
    btnLevels: document.getElementById('btn-levels'),
    btnCloseLevels: document.getElementById('btn-close-levels'),
    btnReset: document.getElementById('btn-reset'),
    btnHint: document.getElementById('btn-hint'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnCustomEq: document.getElementById('btn-custom-eq'),
    btnCloseCustom: document.getElementById('btn-close-custom'),
    btnStartCustom: document.getElementById('btn-start-custom'),
    activityCaption: document.getElementById('activity-caption'),
  };
}

export function hintUsesHtml(game) {
  return !game.activity;
}

export function hintButtonVisible(game, index) {
  if (!game.activity) return true;
  return String(game.levels[index]?.hint ?? '').trim() !== '';
}

export function captionText(game, index) {
  if (!game.activity) return '';
  return `${game.activityName ?? ''} · ${game.levels[index]?.title ?? ''}`;
}

function writeHint(game, lvl) {
  if (hintUsesHtml(game)) game.els.instructionHint.innerHTML = lvl.hint;
  else game.els.instructionHint.textContent = lvl.hint ?? '';
}

function setHintVisible(game, open) {
  game.hintOpen = open;
  game.els.instructionHint.hidden = !open;
  game.els.btnHint.setAttribute('aria-pressed', open ? 'true' : 'false');
}

function showOpNote(game, text) {
  game.els.opNumberNote.hidden = !text;
  game.els.opNumberNote.textContent = text || '';
}

function selectedOperand(game) {
  if (game.els.operandSelector?.hidden) return Operand.NUMBER;
  const raw = game.els.opNumberValue?.value?.trim().toLowerCase() || '';
  if (raw.includes('x')) return Operand.UNKNOWN;
  const checked = game.els.operandSelector?.querySelector('input[name="operand"]:checked');
  return checked?.value === Operand.UNKNOWN ? Operand.UNKNOWN : Operand.NUMBER;
}

export function stepOpValue(game, delta) {
  const operand = selectedOperand(game);
  const current = parseOpNumber(game.els.opNumberValue.value) ?? 1;
  let next;
  if (game.pendingOperation === Operation.MULTIPLY) {
    next = current + delta;
    if (next === 0) next = delta < 0 ? -1 : 1;
  } else {
    const magnitude = Math.abs(current);
    next = Math.max(1, magnitude + delta);
  }
  game.els.opNumberValue.value = formatOpDisplay(next, operand, game.pendingOperation);
  showOpNote(game, '');
}

export function updateOpValueForOperand(game) {
  const checked = game.els.operandSelector?.querySelector('input[name="operand"]:checked');
  const operand = checked?.value === Operand.UNKNOWN ? Operand.UNKNOWN : Operand.NUMBER;
  const current = parseOpNumber(game.els.opNumberValue.value) ?? 1;
  const magnitude = Math.abs(current);
  game.els.opNumberValue.value = formatOpDisplay(magnitude, operand, game.pendingOperation);
  showOpNote(game, '');
}

function triggerOpVisualFeedback(operation) {
  if (typeof document === 'undefined') return;
  const btn = document.querySelector(`.op-btn[data-op="${operation}"]`);
  if (!btn) return;
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), 140);
}

export function beginOperation(game, operation) {
  triggerOpVisualFeedback(operation);
  game.pendingOperation = operation;
  game.els.opsPanel.classList.add('is-asking-number');
  game.els.opNumberPanel.hidden = false;
  const opsHeader = typeof document === 'undefined' ? null : document.querySelector('.ops-header-area');
  if (opsHeader) opsHeader.classList.add('is-hidden');

  const needsOperand = operation === Operation.ADD || operation === Operation.SUBTRACT;
  game.els.operandSelector.hidden = false;
  game.els.operandSelector.classList.toggle('is-number-only', !needsOperand);
  game.els.operandLegend.textContent = mapOperationToTextContent(operation);
  if (needsOperand) {
    game.els.operandNumber.checked = true;
    game.els.opNumberValue.value = formatOpDisplay(1, Operand.NUMBER, operation);
  } else {
    game.els.opNumberValue.value = formatOpDisplay(2, Operand.NUMBER, operation);
  }

  showOpNote(game, '');
  game.els.opNumberValue.focus();
  game.els.opNumberValue.select();
}

function mapOperationToTextContent (operation) {
  switch (operation) {
    case Operation.ADD:
      return 'Somar o quê?';
    case Operation.SUBTRACT:
      return 'Subtrair o quê?';
    case Operation.MULTIPLY:
      return 'Multiplicar por?';
    case Operation.DIVIDE:
      return 'Dividir por?';
    default:
      return '';
  }
}

function cancelOperation(game) {
  game.pendingOperation = null;
  game.els.opsPanel.classList.remove('is-asking-number');
  game.els.opNumberPanel.hidden = true;
  showOpNote(game, '');
  game.els.opNumberValue.blur();
  const opsHeader = document.querySelector('.ops-header-area');
  if (opsHeader) opsHeader.classList.remove('is-hidden');
  const speechBubble = document.getElementById('ops-speech-bubble');
  if (speechBubble) {
    speechBubble.classList.remove('is-visible');
    speechBubble.style.setProperty('--tail-x', '50%');
  }
}

function confirmOperation(game) {
  const operand = selectedOperand(game);
  const { operation } = operationWithOperand(game.pendingOperation, operand);
  const raw = String(game.els.opNumberValue.value || '').trim().toLowerCase();

  if (
    (game.pendingOperation === Operation.MULTIPLY || game.pendingOperation === Operation.DIVIDE) &&
    raw.includes('x')
  ) {
    showOpNote(game, 'Multiplicação e divisão aceitam apenas números.');
    game.els.opNumberValue.focus();
    return;
  }

  const n = parseOpNumber(raw);
  if (n == null) {
    const clean = raw.replace(/−/g, '-').replace(/^[+−\-×*·÷/:\s]+/, '');
    const zero = clean !== '' && (Number(clean) === 0 || clean === '0x');
    showOpNote(
      game,
      zero
        ? 'Zero desequilibra a balança. Escolhe outro número.'
        : 'Escolhe um valor válido diferente de zero.'
    );
    game.els.opNumberValue.focus();
    return;
  }
  const ok = applyNumberToBothSides(game, operation, n, operand);
  if (ok) cancelOperation(game);
}

function isBlockingModalOpen(game) {
  return (
    game.els.winModal.classList.contains('active') ||
    game.els.levelsModal?.classList.contains('active') ||
    game.els.customModal?.classList.contains('active') ||
    game.els.creditsModal?.classList.contains('active')
  );
}

export function advanceFromWinModal(game) {
  if (!game.els.winModal.classList.contains('active')) return false;

  game.els.winModal.classList.remove('active');
  game.els.winModal.inert = true;

  const isFinalLevel = game.completedLevels.size >= game.levels.length;

  if (isFinalLevel) {
    game.completedLevels.clear();
    game.loadLevel(0);
  } else if (game.currentLevelIndex < game.levels.length - 1) {
    game.loadLevel(game.currentLevelIndex + 1);
  } else {
    game.loadLevel(0);
  }
  return true;
}

export function resetCurrentLevel(game) {
  if (isBlockingModalOpen(game)) return false;
  game.loadLevel(game.currentLevelIndex);
  return true;
}

export function handleGameKeydown(game, e) {
  if (game.els.creditsModal?.classList.contains('active')) return;

  if (e.key === 'Escape' && game.pendingOperation) {
    e.preventDefault();
    cancelOperation(game);
    return;
  }

  if (isNextLevelKey(e.key) && game.pendingOperation) {
    if (isTypingTarget(e.target) && e.target !== game.els.opNumberValue) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    confirmOperation(game);
    return;
  }

  if (isNextLevelKey(e.key) && isTypingTarget(e.target)) {
    e.preventDefault();
    return;
  }

  if (isNextLevelKey(e.key)) {
    if (advanceFromWinModal(game)) e.preventDefault();
    return;
  }

  if (isTypingTarget(e.target)) return;

  if (isResetKey(e.key) && !hasKeyModifier(e)) {
    e.preventDefault();
    resetCurrentLevel(game);
    return;
  }

  if (game.pendingOperation) return;

  const operation = operationFromKey(e.key);
  if (!operation) return;
  e.preventDefault();
  applyOperationBothSides(game, operation);
}

export function loadLevel(game, index) {
  game.currentLevelIndex = index;
  const lvl = game.levels[index];

  game.els.levelLabel.textContent = `${index + 1}/${game.levels.length}`;
  writeHint(game, lvl);
  game.els.btnHint.hidden = !hintButtonVisible(game, index);
  if (game.els.activityCaption) {
    game.els.activityCaption.textContent = captionText(game, index);
    game.els.activityCaption.hidden = !game.activity;
  }
  setHintVisible(game, false);
  game.tutor?.hush();
  cancelOperation(game);

  game.lhsItems = lvl.lhs.map((item) => ({
    id: game.itemIdCounter++,
    kind: item.kind,
    num: item.num,
    den: item.den,
  }));
  game.rhsItems = lvl.rhs.map((item) => ({
    id: game.itemIdCounter++,
    kind: item.kind,
    num: item.num,
    den: item.den,
  }));

  game.renderAll();
}

function bindControls(game) {
  game.els.btnSound.addEventListener('click', (e) => {
    const active = game.sound.toggle();
    e.currentTarget.textContent = active ? '🔊' : '🔇';
    game.tutor?.setSoundEnabled(active);
  });

  game.els.btnLevels.addEventListener('click', () => {
    renderLevelsPicker(game);
    game.els.levelsModal.inert = false;
    game.els.levelsModal.classList.add('active');
  });

  game.els.btnCloseLevels.addEventListener('click', () => {
    game.els.levelsModal.classList.remove('active');
    game.els.levelsModal.inert = true;
  });

  game.els.btnCredits.addEventListener('click', () => {
    game.els.creditsModal.inert = false;
    game.els.creditsModal.classList.add('active');
  });

  game.els.btnCloseCredits.addEventListener('click', () => {
    game.els.creditsModal.classList.remove('active');
    game.els.creditsModal.inert = true;
  });

  game.els.btnReset.addEventListener('click', () => {
    resetCurrentLevel(game);
  });

  game.els.btnHint.addEventListener('click', () => {
    const curLvl = game.levels[game.currentLevelIndex];
    writeHint(game, curLvl);
    const next = !game.hintOpen;
    setHintVisible(game, next);
    if (next) {
      game.els.instructionHint.style.animation = 'none';
      void game.els.instructionHint.offsetWidth;
      game.els.instructionHint.style.animation = 'pulse-target 0.6s 2';
      game.tutor?.speakHint(curLvl.hint);
    } else {
      game.tutor?.hush();
    }
  });

  game.els.btnNextLevel.addEventListener('click', () => {
    advanceFromWinModal(game);
  });

  game.els.btnCustomEq.addEventListener('click', () => {
    if (game.els.customEqNote) game.els.customEqNote.hidden = true;
    game.els.customModal.inert = false;
    game.els.customModal.classList.add('active');
  });

  game.els.btnCloseCustom.addEventListener('click', () => {
    game.els.customModal.classList.remove('active');
    game.els.customModal.inert = true;
  });

  game.els.btnStartCustom.addEventListener('click', () => {
    const lx = parseInt(document.getElementById('cust-lx').value, 10) || 0;
    const lc = parseInt(document.getElementById('cust-lc').value, 10) || 0;
    const rx = parseInt(document.getElementById('cust-rx').value, 10) || 0;
    const rc = parseInt(document.getElementById('cust-rc').value, 10) || 0;

    if (game.els.customEqNote) game.els.customEqNote.hidden = true;

    if (lx === rx) {
      if (game.els.customEqNote) {
        game.els.customEqNote.hidden = false;
        game.els.customEqNote.textContent =
          'Os coeficientes de x não podem ser iguais. Isso vira 0x.';
      }
      return;
    }

    const customLhs = [];
    const customRhs = [];
    if (lx !== 0) customLhs.push({ kind: 'variable', num: lx, den: 1 });
    if (lc !== 0) customLhs.push({ kind: 'constant', num: lc, den: 1 });
    if (rx !== 0) customRhs.push({ kind: 'variable', num: rx, den: 1 });
    if (rc !== 0) customRhs.push({ kind: 'constant', num: rc, den: 1 });

    game.levels.push({
      id: game.levels.length + 1,
      title: 'Laboratório Livre Personalizado',
      hint: 'Isole o x com a mesma operação nos dois lados e fundindo termos iguais.',
      lhs: customLhs,
      rhs: customRhs,
    });

    game.els.customModal.classList.remove('active');
    game.els.customModal.inert = true;
    loadLevel(game, game.levels.length - 1);
  });

  const speechBubble = document.getElementById('ops-speech-bubble');
  const speechBubbleText = document.getElementById('ops-speech-bubble-text');
  const defaultBubbleText = 'Escolha a operação desejada';

  document.querySelectorAll('.op-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyOperationBothSides(game, btn.dataset.op);
    });

    const activateHint = () => {
      if (!speechBubble || !speechBubbleText) return;
      speechBubbleText.textContent = btn.dataset.hint || '';
      const btnRect = btn.getBoundingClientRect();
      const bubbleRect = speechBubble.getBoundingClientRect();
      if (bubbleRect.width > 0) {
        const offset = btnRect.left + btnRect.width / 2 - bubbleRect.left;
        const clamped = Math.max(16, Math.min(bubbleRect.width - 16, offset));
        speechBubble.style.setProperty('--tail-x', `${clamped}px`);
      }
      speechBubble.classList.add('is-visible');
    };

    const resetHint = () => {
      if (!speechBubble) return;
      speechBubble.classList.remove('is-visible');
    };

    btn.addEventListener('mouseenter', activateHint);
    btn.addEventListener('mouseleave', resetHint);
    btn.addEventListener('focus', activateHint);
    btn.addEventListener('blur', resetHint);
  });

  game.els.btnOpNumberOk.addEventListener('click', () => confirmOperation(game));
  game.els.btnOpNumberCancel.addEventListener('click', () => cancelOperation(game));

  if (game.els.operandSelector) {
    game.els.operandSelector.addEventListener('change', () => {
      updateOpValueForOperand(game);
    });
    game.els.operandSelector.querySelectorAll('input[name="operand"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        updateOpValueForOperand(game);
      });
    });
  }

  if (game.els.btnOpStepUp) {
    game.els.btnOpStepUp.addEventListener('click', (e) => {
      e.preventDefault();
      stepOpValue(game, 1);
      game.els.opNumberValue.focus();
    });
  }

  if (game.els.btnOpStepDown) {
    game.els.btnOpStepDown.addEventListener('click', (e) => {
      e.preventDefault();
      stepOpValue(game, -1);
      game.els.opNumberValue.focus();
    });
  }

  if (game.els.opNumberValue) {
    game.els.opNumberValue.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepOpValue(game, 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepOpValue(game, -1);
      }
    });

    game.els.opNumberValue.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        stepOpValue(game, 1);
      } else if (e.deltaY > 0) {
        stepOpValue(game, -1);
      }
    }, { passive: false });

    game.els.opNumberValue.addEventListener('input', () => {
      showOpNote(game, '');
      const raw = game.els.opNumberValue.value.trim().toLowerCase();
      if (!game.els.operandSelector?.hidden) {
        if (raw.includes('x') && game.els.operandUnknown) {
          game.els.operandUnknown.checked = true;
        } else if (!raw.includes('x') && game.els.operandNumber && /^[+−\-]?\d+$/.test(raw)) {
          game.els.operandNumber.checked = true;
        }
      }
    });

    game.els.opNumberValue.addEventListener('blur', () => {
      const raw = game.els.opNumberValue.value.trim().toLowerCase();
      if (!raw) return;
      const operand = selectedOperand(game);
      const n = parseOpNumber(raw);
      if (n != null) {
        game.els.opNumberValue.value = formatOpDisplay(n, operand, game.pendingOperation);
      }
    });
  }

  window.addEventListener('keydown', (e) => handleGameKeydown(game, e));
}

export function bootGame({ sound, particles, levels, activityName }) {
  const els = queryEls();
  const activity = Array.isArray(levels);
  const game = {
    sound,
    particles,
    activity,
    activityName: activity ? activityName ?? '' : '',
    levels: (activity ? levels : LEVELS).map((lvl) => ({
      ...lvl,
      lhs: lvl.lhs.map((item) => ({ ...item })),
      rhs: lvl.rhs.map((item) => ({ ...item })),
    })),
    currentLevelIndex: 0,
    lhsItems: [],
    rhsItems: [],
    itemIdCounter: 1,
    completedLevels: new Set(),
    hintOpen: false,
    pendingOperation: null,
    els,
    beginOperation(operation) {
      beginOperation(game, operation);
    },
    stepOpValue(delta) {
      stepOpValue(game, delta);
    },
    updateOpValueForOperand() {
      updateOpValueForOperand(game);
    },
    showOpNote(text) {
      showOpNote(game, text);
    },
    renderAll() {
      renderAll(game);
    },
    checkWin() {
      checkWinCondition(game);
    },
    loadLevel(index) {
      loadLevel(game, index);
    },
  };

  els.btnLevels.hidden = activity;
  els.btnCustomEq.hidden = activity;

  bindControls(game);
  loadLevel(game, 0);
  return game;
}
