import { formatAlgebraicSide } from './algebra.js';
import { setupDrag } from './drag.js';

function tokenMeta(type) {
  switch (type) {
    case '+x':
      return { typeClass: 'token-pos-x', subTxt: 'variável' };
    case '-x':
      return { typeClass: 'token-neg-x', subTxt: 'anti-x' };
    case '+1':
      return { typeClass: 'token-pos-1', subTxt: 'unidade' };
    case '-1':
      return { typeClass: 'token-neg-1', subTxt: 'anti-1' };
    default:
      return { typeClass: '', subTxt: '' };
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
    const { typeClass, subTxt } = tokenMeta(item.type);

    el.className = `game-token ${typeClass}`;
    el.dataset.id = item.id;
    el.dataset.type = item.type;
    el.dataset.side = sideName;

    el.innerHTML = `
      <span>${item.type}</span>
      <span class="token-sub-label">${subTxt}</span>
    `;

    setupDrag(el, item, sideName, game);
    containerEl.appendChild(el);
  });
}

export function renderAll(game) {
  const { els } = game;
  renderContainer(game.lhsItems, els.dropzoneLhs, 'lhs', game);
  renderContainer(game.rhsItems, els.dropzoneRhs, 'rhs', game);

  els.countLhs.textContent = `${game.lhsItems.length} ${game.lhsItems.length === 1 ? 'item' : 'itens'}`;
  els.countRhs.textContent = `${game.rhsItems.length} ${game.rhsItems.length === 1 ? 'item' : 'itens'}`;

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
