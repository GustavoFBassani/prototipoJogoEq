import { LEVELS } from './levels.js';
import { renderAll, renderLevelsPicker } from './render.js';
import { applyOperationBothSides, applyNumberToBothSides, parseOpNumber } from './operations.js';
import { checkWinCondition } from './win.js';
import { opFromKey, isTypingTarget } from './keys.js';

function queryEls() {
  return {
    dropzoneLhs: document.getElementById('dropzone-lhs'),
    dropzoneRhs: document.getElementById('dropzone-rhs'),
    mathLhs: document.getElementById('math-lhs'),
    mathRhs: document.getElementById('math-rhs'),
    levelLabel: document.getElementById('current-level-label'),
    instructionHint: document.getElementById('instruction-hint'),
    winModal: document.getElementById('win-modal'),
    winSolText: document.getElementById('win-sol-text'),
    levelsModal: document.getElementById('levels-modal'),
    levelsGrid: document.getElementById('levels-grid'),
    customModal: document.getElementById('custom-modal'),
    opsPanel: document.querySelector('.operations-panel'),
    opNumberPanel: document.getElementById('op-number-panel'),
    opNumberPrompt: document.getElementById('op-number-prompt'),
    opNumberValue: document.getElementById('op-number-value'),
    opNumberNote: document.getElementById('op-number-note'),
    customEqNote: document.getElementById('custom-eq-note'),
    btnOpNumberOk: document.getElementById('btn-op-number-ok'),
    btnOpNumberCancel: document.getElementById('btn-op-number-cancel'),
    btnSound: document.getElementById('btn-sound'),
    btnLevels: document.getElementById('btn-levels'),
    btnCloseLevels: document.getElementById('btn-close-levels'),
    btnReset: document.getElementById('btn-reset'),
    btnHint: document.getElementById('btn-hint'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnCustomEq: document.getElementById('btn-custom-eq'),
    btnCloseCustom: document.getElementById('btn-close-custom'),
    btnStartCustom: document.getElementById('btn-start-custom'),
  };
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

const OP_NUMBER_UI = {
  '+N': { prompt: 'Somar quanto nos dois lados?', value: '1' },
  '-N': { prompt: 'Subtrair quanto dos dois lados?', value: '1' },
  '+Nx': { prompt: 'Somar quantos x nos dois lados?', value: '1' },
  '-Nx': { prompt: 'Subtrair quantos x dos dois lados?', value: '1' },
  '*N': { prompt: 'Multiplicar os dois lados por quanto?', value: '2' },
  '/N': { prompt: 'Dividir os dois lados por quanto?', value: '2' },
};

function beginNumberOp(game, opType) {
  const ui = OP_NUMBER_UI[opType] ?? { prompt: 'Qual número?', value: '1' };
  game.pendingNumberOp = opType;
  game.els.opsPanel.classList.add('is-asking-number');
  game.els.opNumberPanel.hidden = false;
  game.els.opNumberPrompt.textContent = ui.prompt;
  game.els.opNumberValue.value = ui.value;
  showOpNote(game, '');
  game.els.opNumberValue.focus();
  game.els.opNumberValue.select();
}

function cancelNumberOp(game) {
  game.pendingNumberOp = null;
  game.els.opsPanel.classList.remove('is-asking-number');
  game.els.opNumberPanel.hidden = true;
  showOpNote(game, '');
}

function confirmNumberOp(game) {
  const n = parseOpNumber(game.els.opNumberValue.value);
  if (n == null) {
    const zero = Number(game.els.opNumberValue.value) === 0;
    showOpNote(
      game,
      zero
        ? 'Zero desequilibra a balança. Escolhe outro número.'
        : 'Escolhe um número diferente de zero.'
    );
    game.els.opNumberValue.focus();
    return;
  }
  const ok = applyNumberToBothSides(game, game.pendingNumberOp, n);
  if (ok) cancelNumberOp(game);
}

export function loadLevel(game, index) {
  game.currentLevelIndex = index;
  const lvl = game.levels[index];

  game.els.levelLabel.textContent = `${index + 1}/${game.levels.length}`;
  game.els.instructionHint.innerHTML = lvl.hint;
  setHintVisible(game, false);
  cancelNumberOp(game);

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
  });

  game.els.btnLevels.addEventListener('click', () => {
    renderLevelsPicker(game);
    game.els.levelsModal.classList.add('active');
  });

  game.els.btnCloseLevels.addEventListener('click', () => {
    game.els.levelsModal.classList.remove('active');
  });

  game.els.btnReset.addEventListener('click', () => {
    loadLevel(game, game.currentLevelIndex);
  });

  game.els.btnHint.addEventListener('click', () => {
    const curLvl = game.levels[game.currentLevelIndex];
    game.els.instructionHint.innerHTML = curLvl.hint;
    const next = !game.hintOpen;
    setHintVisible(game, next);
    if (next) {
      game.els.instructionHint.style.animation = 'none';
      void game.els.instructionHint.offsetWidth;
      game.els.instructionHint.style.animation = 'pulse-target 0.6s 2';
    }
  });

  game.els.btnNextLevel.addEventListener('click', () => {
    game.els.winModal.classList.remove('active');

    const isFinalLevel = game.completedLevels.size >= game.levels.length;

    if (isFinalLevel) {
      game.completedLevels.clear();
      loadLevel(game, 0);
    } else if (game.currentLevelIndex < game.levels.length - 1) {
      loadLevel(game, game.currentLevelIndex + 1);
    } else {
      loadLevel(game, 0);
    }
  });

  game.els.btnCustomEq.addEventListener('click', () => {
    if (game.els.customEqNote) game.els.customEqNote.hidden = true;
    game.els.customModal.classList.add('active');
  });

  game.els.btnCloseCustom.addEventListener('click', () => {
    game.els.customModal.classList.remove('active');
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
    loadLevel(game, game.levels.length - 1);
  });

  document.querySelectorAll('.op-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyOperationBothSides(game, btn.dataset.op);
    });
  });

  game.els.btnOpNumberOk.addEventListener('click', () => confirmNumberOp(game));
  game.els.btnOpNumberCancel.addEventListener('click', () => cancelNumberOp(game));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && game.pendingNumberOp) {
      e.preventDefault();
      cancelNumberOp(game);
      return;
    }

    if (e.key === 'Enter' && game.pendingNumberOp) {
      if (isTypingTarget(e.target) && e.target !== game.els.opNumberValue) return;
      e.preventDefault();
      confirmNumberOp(game);
      return;
    }

    if (isTypingTarget(e.target)) return;
    if (game.pendingNumberOp) return;

    const op = opFromKey(e.key);
    if (!op) return;
    e.preventDefault();
    applyOperationBothSides(game, op);
  });
}

export function bootGame({ sound, particles }) {
  const els = queryEls();
  const game = {
    sound,
    particles,
    levels: LEVELS.map((lvl) => ({
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
    pendingNumberOp: null,
    els,
    beginNumberOp(opType) {
      beginNumberOp(game, opType);
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

  bindControls(game);
  loadLevel(game, 0);
  return game;
}
