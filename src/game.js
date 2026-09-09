import { LEVELS } from './levels.js';
import { createDialog } from './dialog.js';
import { renderAll, renderLevelsPicker } from './render.js';
import { applyOperationBothSides } from './operations.js';
import { checkWinCondition } from './win.js';

function queryEls() {
  return {
    dropzoneLhs: document.getElementById('dropzone-lhs'),
    dropzoneRhs: document.getElementById('dropzone-rhs'),
    mathLhs: document.getElementById('math-lhs'),
    mathRhs: document.getElementById('math-rhs'),
    countLhs: document.getElementById('count-lhs'),
    countRhs: document.getElementById('count-rhs'),
    levelLabel: document.getElementById('current-level-label'),
    levelGoalTitle: document.getElementById('level-goal-title'),
    instructionHint: document.getElementById('instruction-hint'),
    winModal: document.getElementById('win-modal'),
    winSolText: document.getElementById('win-sol-text'),
    levelsModal: document.getElementById('levels-modal'),
    levelsGrid: document.getElementById('levels-grid'),
    customModal: document.getElementById('custom-modal'),
    inputModal: document.getElementById('input-modal'),
    inputModalTitle: document.getElementById('input-modal-title'),
    inputModalDesc: document.getElementById('input-modal-desc'),
    inputModalIcon: document.getElementById('input-modal-icon'),
    inputModalField: document.getElementById('input-modal-value'),
    inputModalFieldContainer: document.getElementById('input-modal-field-container'),
    btnInputConfirm: document.getElementById('btn-input-confirm'),
    btnInputCancel: document.getElementById('btn-input-cancel'),
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

export function loadLevel(game, index) {
  game.currentLevelIndex = index;
  const lvl = game.levels[index];

  game.els.levelLabel.textContent = `${index + 1}/${game.levels.length}`;
  game.els.levelGoalTitle.textContent = `Nível ${index + 1}: ${lvl.title}`;
  game.els.instructionHint.innerHTML = `💡 <b>Dica:</b> ${lvl.hint}`;

  game.lhsItems = lvl.lhs.map((item) => ({ id: game.itemIdCounter++, type: item.type }));
  game.rhsItems = lvl.rhs.map((item) => ({ id: game.itemIdCounter++, type: item.type }));

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
    game.els.instructionHint.innerHTML = `💡 <b>Dica:</b> ${curLvl.hint}`;
    game.els.instructionHint.style.animation = 'pulse-target 0.6s 2';
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

    const customLhs = [];
    const customRhs = [];

    for (let i = 0; i < Math.abs(lx); i++) customLhs.push({ type: lx > 0 ? '+x' : '-x' });
    for (let i = 0; i < Math.abs(lc); i++) customLhs.push({ type: lc > 0 ? '+1' : '-1' });
    for (let i = 0; i < Math.abs(rx); i++) customRhs.push({ type: rx > 0 ? '+x' : '-x' });
    for (let i = 0; i < Math.abs(rc); i++) customRhs.push({ type: rc > 0 ? '+1' : '-1' });

    game.levels.push({
      id: game.levels.length + 1,
      title: 'Laboratório Livre Personalizado',
      hint: 'Isole a variável x aplicando operações equivalentes em ambos os lados.',
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
}

export function bootGame({ sound, particles }) {
  const els = queryEls();
  const game = {
    sound,
    particles,
    levels: LEVELS,
    currentLevelIndex: 0,
    lhsItems: [],
    rhsItems: [],
    itemIdCounter: 1,
    completedLevels: new Set(),
    els,
    showCustomDialog: createDialog(els),
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
