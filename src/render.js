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
      // Mantém o primeiro item como referência principal para o ID e drag
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

  if (items.length === 0) {
    containerEl.classList.add('empty-state');
  } else {
    containerEl.classList.remove('empty-state');
  }

  // Agrupa os itens para exibição limpa
  const groupedItems = groupItems(items);

  groupedItems.forEach((group) => {
    const isVar = group.type.includes('x');
    const sign = group.type.charAt(0);
    
    // Formata o rótulo visual (ex: "+5", "-3", "+2x")
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

    // Vincula o arraste utilizando o primeiro item do grupo
    setupDrag(el, group, sideName, game);
    containerEl.appendChild(el);
  });
}

export function renderAll(game) {
  const { els } = game;
  renderContainer(game.lhsItems, els.dropzoneLhs, 'lhs', game);
  renderContainer(game.rhsItems, els.dropzoneRhs, 'rhs', game);

  els.mathLhs.textContent = formatAlgebraicSide(game.lhsItems);
  
  // Utiliza a função com suporte à fração pendente para evitar exibir "0" indevidamente
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
      game.loadLevel(idx);
    });
    els.levelsGrid.appendChild(btn);
  });
}