import { LEVELS } from './levels.js';
import { renderAll, renderLevelsPicker } from './render.js';
import { minimumSteps } from './algebra.js';
import { applyOperationBothSides, applyNumberToBothSides, parseOpNumber, formatOpDisplay } from './operations.js';
import { checkWinCondition, scoreForSteps } from './win.js';
import { Operation, Operand, operationFromKey, operationWithOperand, isTypingTarget, isResetKey, isNextLevelKey, hasKeyModifier } from './keys.js';

export const TUTORIAL_STEPS = [
  {
    text: 'O objetivo do jogo é deixar o x sozinho de um dos lados para descobrir o seu valor. A equação aqui em cima mostra o que está em cada lado!',
    target: '.math-formula-wrapper',
  },
  {
    text: 'Para isolar o x, você pode somar, subtrair, multiplicar ou dividir. Mas atenção: tudo o que você fizer de um lado, também será feito do outro para manter o equilíbrio nos dois lados!',
    target: '.operations-panel',
  },
  {
    text: 'Estes são os pratos da balança com as peças. Você pode arrastar peças semelhantes no mesmo lado para juntar termos ou cancelá-los.',
    target: '.containers-grid',
  },
  {
    text: 'A equação se atualiza a cada movimento até que o x fique sozinho com a solução (por exemplo: x = 3)!',
    target: '.math-formula-wrapper',
  },
  {
    text: 'Acompanhe aqui os seus passos e a sua pontuação. Tente resolver a equação no menor número de jogadas para garantir a pontuação máxima!',
    target: '#step-count',
  },
  {
    text: 'Ficou em dúvida sobre o que fazer? Clique em Dica para receber uma ajuda sobre o próximo passo.',
    target: '#btn-hint',
  },
];

function queryEls() {
  return {
    dropzoneLhs: document.getElementById('dropzone-lhs'),
    dropzoneRhs: document.getElementById('dropzone-rhs'),
    mathLhs: document.getElementById('math-lhs'),
    mathRhs: document.getElementById('math-rhs'),
    mathFormulaWrapper: document.querySelector('.math-formula-wrapper'),
    levelLabel: document.getElementById('current-level-label'),
    stepCount: document.getElementById('step-count'),
    instructionHint: document.getElementById('instruction-hint'),
    winModal: document.getElementById('win-modal'),
    winSolText: document.getElementById('win-sol-text'),
    winScore: document.getElementById('win-score'),
    tutorialModal: document.getElementById('tutorial-modal'),
    tutorialCard: document.getElementById('tutorial-card') || document.querySelector('.tutorial-card'),
    tutorialProgress: document.getElementById('tutorial-progress'),
    tutorialStepText: document.getElementById('tutorial-step-text'),
    btnPreviousTutorial: document.getElementById('btn-previous-tutorial'),
    btnNextTutorial: document.getElementById('btn-next-tutorial'),
    btnCloseTutorial: document.getElementById('btn-close-tutorial'),
    btnSkipTutorial: document.getElementById('btn-skip-tutorial'),
    btnSkipTutorialIcon: document.getElementById('btn-skip-tutorial-icon'),
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
    btnTutorial: document.getElementById('btn-tutorial'),
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
    stepValue: document.getElementById('step-value'),
    scoreCount: document.getElementById('score-count'),
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

export function optimizedCustomSteps(lx, lc, rx, rc) {
  let steps = 0;
  if (rx !== 0) steps += 2 + Number(lx !== 0);
  if (lc !== 0) steps += 2 + Number(rc !== 0);
  if (Math.abs(lx - rx) !== 1) steps += 1;
  return Math.max(1, steps);
}

export const TUTORIAL_SEEN_STORAGE_KEY = 'equalab:tutorial-seen';

export function hasSeenTutorial(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  try {
    return storage?.getItem(TUTORIAL_SEEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTutorialSeen(storage = (typeof window !== 'undefined' ? window.localStorage : null), seen = true) {
  try {
    if (seen) {
      storage?.setItem(TUTORIAL_SEEN_STORAGE_KEY, 'true');
    } else {
      storage?.removeItem(TUTORIAL_SEEN_STORAGE_KEY);
    }
  } catch {
    /* storage full or blocked */
  }
}

export function calculateTutorialPosition({
  targetRect,
  cardWidth,
  cardHeight,
  viewportWidth,
  viewportHeight,
  gap = 18,
  margin = 16,
}) {
  if (
    !targetRect ||
    typeof targetRect.top !== 'number' ||
    typeof targetRect.left !== 'number' ||
    (targetRect.width <= 0 && targetRect.height <= 0)
  ) {
    return {
      left: Math.max(margin, Math.round((viewportWidth - cardWidth) / 2)),
      top: Math.max(margin, Math.round((viewportHeight - cardHeight) / 2)),
      placement: 'center',
    };
  }

  const spaceAbove = targetRect.top - margin;
  const spaceBelow = viewportHeight - targetRect.bottom - margin;
  const spaceLeft = targetRect.left - margin;
  const spaceRight = viewportWidth - targetRect.right - margin;

  const fitsAbove = spaceAbove >= cardHeight + gap;
  const fitsBelow = spaceBelow >= cardHeight + gap;
  const fitsLeft = spaceLeft >= cardWidth + gap;
  const fitsRight = spaceRight >= cardWidth + gap;

  const targetCenterY = targetRect.top + targetRect.height / 2;
  const isUpperHalf = targetCenterY < viewportHeight / 2;

  let placement;
  if (isUpperHalf) {
    if (fitsBelow) {
      placement = 'below';
    } else if (fitsAbove) {
      placement = 'above';
    } else if (fitsRight) {
      placement = 'right';
    } else if (fitsLeft) {
      placement = 'left';
    }
  } else {
    if (fitsAbove) {
      placement = 'above';
    } else if (fitsBelow) {
      placement = 'below';
    } else if (fitsRight) {
      placement = 'right';
    } else if (fitsLeft) {
      placement = 'left';
    }
  }

  if (!placement) {
    const spaces = [
      { name: 'below', space: spaceBelow },
      { name: 'above', space: spaceAbove },
      { name: 'right', space: spaceRight },
      { name: 'left', space: spaceLeft },
    ];
    spaces.sort((a, b) => b.space - a.space);
    placement = spaces[0].name;
  }

  let left;
  let top;

  if (placement === 'below') {
    top = targetRect.bottom + gap;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    left = targetCenterX - cardWidth / 2;
  } else if (placement === 'above') {
    top = targetRect.top - gap - cardHeight;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    left = targetCenterX - cardWidth / 2;
  } else if (placement === 'right') {
    left = targetRect.right + gap;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    top = targetCenterY - cardHeight / 2;
  } else {
    left = targetRect.left - gap - cardWidth;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    top = targetCenterY - cardHeight / 2;
  }

  const maxLeft = Math.max(margin, viewportWidth - cardWidth - margin);
  const maxTop = Math.max(margin, viewportHeight - cardHeight - margin);

  left = Math.max(margin, Math.min(maxLeft, Math.round(left)));
  top = Math.max(margin, Math.min(maxTop, Math.round(top)));

  return { left, top, placement };
}

export function positionTutorialCard(game, targetRect) {
  if (!game.els?.tutorialCard) return;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const cardWidth = game.els.tutorialCard.offsetWidth || 380;
  const cardHeight = game.els.tutorialCard.offsetHeight || 220;

  const { left, top } = calculateTutorialPosition({
    targetRect,
    cardWidth,
    cardHeight,
    viewportWidth,
    viewportHeight,
    gap: 18,
    margin: 16,
  });

  game.els.tutorialCard.style.left = `${left}px`;
  game.els.tutorialCard.style.top = `${top}px`;
}

export function showTutorial(game) {
  setTutorialSeen(game.storage, true);
  game.els.tutorialModal.inert = false;
  game.els.tutorialModal.classList.add('active');
  showTutorialStep(game, 0);
}

export function showTutorialStep(game, index) {
  const step = TUTORIAL_STEPS[index];
  game.tutorialStepIndex = index;
  game.els.tutorialProgress.textContent = `Etapa ${index + 1} de ${TUTORIAL_STEPS.length}`;
  game.els.tutorialStepText.textContent = step.text;
  game.els.btnPreviousTutorial.hidden = index === 0;
  game.els.btnNextTutorial.hidden = index === TUTORIAL_STEPS.length - 1;
  game.els.btnCloseTutorial.hidden = index !== TUTORIAL_STEPS.length - 1;
  if (game.els.btnSkipTutorial) {
    game.els.btnSkipTutorial.hidden = index === TUTORIAL_STEPS.length - 1;
  }
  game.tutorialTarget?.classList.remove('tutorial-highlight');
  game.tutorialTarget = null;

  const target = typeof document !== 'undefined' ? document.querySelector(step.target) : null;
  if (target && !target.hidden) {
    target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const bounds = target.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) {
      target.classList.add('tutorial-highlight');
      game.tutorialTarget = target;
      game.els.tutorialModal.classList.add('tutorial-spotlight');
      game.els.tutorialModal.style?.setProperty('--tutorial-spotlight-x', `${bounds.left + bounds.width / 2}px`);
      game.els.tutorialModal.style?.setProperty('--tutorial-spotlight-y', `${bounds.top + bounds.height / 2}px`);
      game.els.tutorialModal.style?.setProperty(
        '--tutorial-spotlight-radius',
        `${Math.hypot(bounds.width, bounds.height) / 2 + 18}px`,
      );
      positionTutorialCard(game, bounds);
    } else {
      game.els.tutorialModal.classList.remove('tutorial-spotlight');
      positionTutorialCard(game, null);
    }
  } else {
    game.els.tutorialModal.classList.remove('tutorial-spotlight');
    positionTutorialCard(game, null);
  }
}

export function closeTutorial(game) {
  setTutorialSeen(game.storage, true);
  game.els.tutorialModal.classList.remove('active', 'tutorial-spotlight');
  game.els.tutorialModal.inert = true;
  game.tutorialTarget?.classList.remove('tutorial-highlight');
  game.tutorialTarget = null;
  game.tutor?.hush();
}

function writeHint(game, lvl) {
  if (!game.els.instructionHint) return;
  if (hintUsesHtml(game)) game.els.instructionHint.innerHTML = lvl.hint;
  else game.els.instructionHint.textContent = lvl.hint ?? '';
}

function setHintVisible(game, open) {
  game.hintOpen = open;
  if (game.els.instructionHint) game.els.instructionHint.hidden = !open;
  game.els.btnHint.setAttribute('aria-pressed', open ? 'true' : 'false');
}

function showOpNote(game, text) {
  game.els.opNumberNote.hidden = !text;
  game.els.opNumberNote.textContent = text || '';
}

function focusOperationInput(game, selectValue = false) {
  const isTouchDevice = typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse) and (hover: none)').matches;
  if (isTouchDevice) return;

  game.els.opNumberValue.focus();
  if (selectValue) game.els.opNumberValue.select();
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
  if (game.pendingOperation === Operation.MULTIPLY || game.pendingOperation === Operation.DIVIDE) {
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
  focusOperationInput(game, true);
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
    focusOperationInput(game);
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
    focusOperationInput(game);
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
    game.els.tutorialModal?.classList.contains('active') ||
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
  if (game.els.tutorialModal?.classList.contains('active')) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTutorial(game);
    }
    return;
  }

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
  game.steps = 0;
  game.stepCount = 0;
  game.minimumSteps = minimumSteps(lvl.lhs, lvl.rhs);
  game.updateStepCount();
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
  game.els.btnTutorial.addEventListener('click', () => showTutorial(game));

  game.els.btnSkipTutorial?.addEventListener('click', () => {
    closeTutorial(game);
  });

  game.els.btnSkipTutorialIcon?.addEventListener('click', () => {
    closeTutorial(game);
  });

  game.els.btnPreviousTutorial.addEventListener('click', () => {
    if (game.tutorialStepIndex > 0) showTutorialStep(game, game.tutorialStepIndex - 1);
  });

  game.els.btnNextTutorial.addEventListener('click', () => {
    if (game.tutorialStepIndex < TUTORIAL_STEPS.length - 1) {
      showTutorialStep(game, game.tutorialStepIndex + 1);
    }
  });

  game.els.btnCloseTutorial.addEventListener('click', () => {
    closeTutorial(game);
  });

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
      if (game.els.instructionHint) {
        game.els.instructionHint.style.animation = 'none';
        void game.els.instructionHint.offsetWidth;
        game.els.instructionHint.style.animation = 'pulse-target 0.6s 2';
      }
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
      minSteps: optimizedCustomSteps(lx, lc, rx, rc),
      title: 'Laboratório Livre Personalizado',
      hint: 'Isole o x com a mesma operação nos dois lados e fundindo termos iguais.',
      lhs: customLhs,
      rhs: customRhs,
    });

    game.els.customModal.classList.remove('active');
    game.els.customModal.inert = true;
    loadLevel(game, game.levels.length - 1);
    game.tutor?.explainCustomEquation();
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
      focusOperationInput(game);
    });
  }

  if (game.els.btnOpStepDown) {
    game.els.btnOpStepDown.addEventListener('click', (e) => {
      e.preventDefault();
      stepOpValue(game, -1);
      focusOperationInput(game);
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

export function bootGame({ sound, particles, levels, activityName, storage } = {}) {
  const els = queryEls();
  const activity = Array.isArray(levels);
  const appStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  const game = {
    sound,
    particles,
    storage: appStorage,
    activity,
    activityName: activity ? activityName ?? '' : '',
    levels: (activity ? levels : LEVELS).map((lvl) => ({
      ...lvl,
      lhs: lvl.lhs.map((item) => ({ ...item })),
      rhs: lvl.rhs.map((item) => ({ ...item })),
    })),
    currentLevelIndex: 0,
    stepCount: 0,
    minimumSteps: 0,
    lhsItems: [],
    rhsItems: [],
    itemIdCounter: 1,
    completedLevels: new Set(),
    hintOpen: false,
    pendingOperation: null,
    steps: 0,
    tutorialStepIndex: 0,
    tutorialTarget: null,
    els,
    recordStep() {
      game.steps += 1;
      game.stepCount = game.steps;
      game.updateStepCount();
    },
    updateStepCount() {
      if (!els.stepCount) return;
      const minimum = game.levels[game.currentLevelIndex]?.minSteps ?? game.minimumSteps;
      const score = scoreForSteps(game.steps, minimum);
      els.stepValue.textContent = minimum ? `${game.steps}/${minimum}` : String(game.steps);
      if (els.scoreCount) els.scoreCount.textContent = score === null ? '—' : String(score);
      els.stepCount.setAttribute(
        'aria-label',
        minimum
          ? `Passos utilizados: ${game.steps}. Mínimo otimizado: ${minimum}. Pontuação: ${score} pontos.`
          : `Passos utilizados: ${game.steps}. Pontuação indisponível.`,
      );
    },
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

  if (!hasSeenTutorial(appStorage)) {
    showTutorial(game);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      if (game.els.tutorialModal?.classList.contains('active')) {
        showTutorialStep(game, game.tutorialStepIndex);
      }
    });
  }

  return game;
}
