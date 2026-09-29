import { formatAlgebraicSide, getTokenClasses, renderTokenContent } from './algebra.js';
import { setupDrag } from './drag.js';

function renderContainer(items, containerEl, sideName, game) {
  containerEl.innerHTML = '';

  if (items.length === 0) {
    containerEl.classList.add('empty-state');
  } else {
    containerEl.classList.remove('empty-state');
  }

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = `game-token ${getTokenClasses(item)}`;
    el.dataset.id = item.id;
    el.dataset.kind = item.kind;
    el.dataset.side = sideName;
    el.setAttribute('aria-label', formatAlgebraicSide([item]));

    el.innerHTML = renderTokenContent(item);

    setupDrag(el, item, sideName, game);
    containerEl.appendChild(el);
  });
}

export function renderAll(game) {
  const { els } = game;
  els.stepCount.textContent = String(game.stepCount);
  renderContainer(game.lhsItems, els.dropzoneLhs, 'lhs', game);
  renderContainer(game.rhsItems, els.dropzoneRhs, 'rhs', game);

  els.mathLhs.textContent = formatAlgebraicSide(game.lhsItems);
  els.mathRhs.textContent = formatAlgebraicSide(game.rhsItems);

  if (els.mathFormulaWrapper?.classList) {
    els.mathFormulaWrapper.classList.remove('is-updated');
    if ('offsetWidth' in els.mathFormulaWrapper) {
      void els.mathFormulaWrapper.offsetWidth;
    }
    els.mathFormulaWrapper.classList.add('is-updated');
  }

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
      els.levelsModal.inert = true;
      game.loadLevel(idx);
    });
    els.levelsGrid.appendChild(btn);
  });
}
