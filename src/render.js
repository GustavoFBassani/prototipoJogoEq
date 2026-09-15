import { formatAlgebraicSide, formatSideWithFraction } from './algebra.js';
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

// Agrupa itens do mesmo tipo para renderização visual compacta (aglutinação)
function groupItems(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.type)) {
      map.set(item.type, { ...item, count: 1, originalItems: [item] });
    } else {
      const group = map.get(item.type);
      group.count += 1;
      group.originalItems.push(item);
    }
  });
  return Array.from(map.values());
}

function renderContainer(items, containerEl, sideName, game) {
  containerEl.innerHTML = '';

  if (!items || items.length === 0) {
    containerEl.classList.add('empty-state');
    return;
  } else {
    containerEl.classList.remove('empty-state');
  }

  const groupedItems = groupItems(items);

  groupedItems.forEach((group) => {
    const isVar = group.type.includes('x');
    const sign = group.type.charAt(0);
    
    let displayLabel = '';
    if (isVar) {
      displayLabel = group.count === 1 ? `${sign}x` : `${sign}${group.count}x`;
    } else {
      displayLabel = `${sign}${group.count}`;
    }

    const el = document.createElement('div');
    el.className = `game-token ${tokenClass(group.type)}`;
    el.dataset.id = group.id;
    el.dataset.type = group.type;
    el.dataset.side = sideName;
    el.setAttribute('aria-label', displayLabel);

    el.innerHTML = `<span>${displayLabel}</span>`;

    setupDrag(el, group, sideName, game);
    containerEl.appendChild(el);
  });
}

export function renderAll(game) {
  const { els } = game;

  // CORREÇÃO: Se o lado direito (RHS) possui itens visuais normais (tokens),
  // significa que estamos em um novo estado/fase e não deve existir fração pendente antiga travando a tela.
  if (game.rhsItems && game.rhsItems.length > 0) {
    game.pendingFraction = null;
  }

  renderContainer(game.lhsItems, els.dropzoneLhs, 'lhs', game);
  renderContainer(game.rhsItems, els.dropzoneRhs, 'rhs', game);

  els.mathLhs.textContent = formatAlgebraicSide(game.lhsItems);
  els.mathRhs.textContent = formatSideWithFraction(game.rhsItems, game.pendingFraction);

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
      
      game.pendingFraction = null;
      game.loadLevel(idx);
    });
    els.levelsGrid.appendChild(btn);
  });
}