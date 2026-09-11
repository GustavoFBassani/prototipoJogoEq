import { formatAlgebraicSide } from './algebra.js';
import { setupDrag } from './drag.js';

function tokenClass(type) {
  switch (type) {
    case '+x':
      return 'token-pos-x';
    case '-x':
      return 'token-neg-x';
    case '+1':
      return 'token-pos-1';
    case '-1':
      return 'token-neg-1';
    default:
      return '';
  }
}

function renderContainer(items, containerEl, sideName, game) {
  containerEl.innerHTML = '';

  if (items.length === 0) {
    containerEl.classList.add('empty-state');
  } else {
    containerEl.classList.remove('empty-state');
  }

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = `game-token ${tokenClass(item.type)}`;
    el.dataset.id = item.id;
    el.dataset.type = item.type;
    el.dataset.side = sideName;
    el.setAttribute('aria-label', item.type);

    el.innerHTML = `<span>${item.type}</span>`;

    setupDrag(el, item, sideName, game);
    containerEl.appendChild(el);
  });
}

export function renderAll(game) {
  const { els } = game;
  renderContainer(game.lhsItems, els.dropzoneLhs, 'lhs', game);
  renderContainer(game.rhsItems, els.dropzoneRhs, 'rhs', game);

  els.mathLhs.textContent = formatAlgebraicSide(game.lhsItems);
  els.mathRhs.textContent = formatAlgebraicSide(game.rhsItems);

  game.checkWin();
}

export function renderLevelsPicker(game) {
  const { els, levels } = game;
  els.levelsGrid.innerHTML = '';
  levels.forEach((lvl, idx) => {
    const btn = document.createElement('button');
    btn.className = `lvl-btn ${idx === game.currentLevelIndex ? 'active' : ''}`;
    btn.textContent = `${idx + 1}`;
    btn.title = lvl.title;
    btn.addEventListener('click', () => {
      els.levelsModal.classList.remove('active');
      game.loadLevel(idx);
    });
    els.levelsGrid.appendChild(btn);
  });
}
