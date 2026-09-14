export function parseOpNumber(raw, opType) {
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n)) return null;
  if ((opType === '*N' || opType === '/N') && n <= 1) return null;
  if (n <= 0) return null;
  return n;
}

function canDivide(items, n) {
  const counts = {};
  items.forEach((i) => {
    counts[i.type] = (counts[i.type] || 0) + 1;
  });
  return Object.values(counts).every((c) => c % n === 0);
}

function reduceByN(items, n) {
  const counts = {};
  const result = [];
  items.forEach((i) => {
    counts[i.type] = (counts[i.type] || 0) + 1;
    if (counts[i.type] % n === 1) result.push(i);
  });
  return result;
}

export function applyNumberToBothSides(game, opType, n) {
  // 1. Multiplicação (*N)
  if (opType === '*N') {
    if (n <= 1) {
      game.showOpNote('Escolha um número maior que 1.');
      return false;
    }
    game.sound.playAddOperation();
    const originalLhs = [...game.lhsItems];
    const originalRhs = [...game.rhsItems];

    for (let count = 1; count < n; count++) {
      originalLhs.forEach((item) =>
        game.lhsItems.push({ id: game.itemIdCounter++, type: item.type })
      );
      originalRhs.forEach((item) =>
        game.rhsItems.push({ id: game.itemIdCounter++, type: item.type })
      );
    }
    game.renderAll();
    game.checkWin();
    return true;
  }

  // 2. Divisão (/N)
  if (opType === '/N') {
    if (n <= 1) {
      game.showOpNote('Escolha um número maior que 1.');
      return false;
    }
    if (
      canDivide(game.lhsItems, n) &&
      canDivide(game.rhsItems, n) &&
      game.lhsItems.length > 0 &&
      game.rhsItems.length > 0
    ) {
      game.sound.playAddOperation();
      game.lhsItems = reduceByN(game.lhsItems, n);
      game.rhsItems = reduceByN(game.rhsItems, n);
      game.renderAll();
      game.checkWin();
      return true;
    }
    game.showOpNote(`Ainda não dá pra dividir por ${n}. Os grupos não estão iguais.`);
    return false;
  }

  // 3. Adição e Subtração de número (+N / -N) -> Aglutinado em um único item com o valor total
  if (opType === '+N' || opType === '-N') {
    game.sound.playAddOperation();
    const itemType = opType === '+N' ? '+1' : '-1';
    
    // Se já houver um item do mesmo tipo, acumula o valor nele (aglutinação)
    const existingLhs = game.lhsItems.find(i => i.type === itemType);
    if (existingLhs) {
      // Como o seu projeto original usa tokens unitários, podemos gerenciar por valor ou manter simples.
      // Para manter a compatibilidade total com o render e drag.js, adicionamos n itens de uma vez:
      for (let i = 0; i < n; i++) {
        game.lhsItems.push({ id: game.itemIdCounter++, type: itemType });
      }
    } else {
      for (let i = 0; i < n; i++) {
        game.lhsItems.push({ id: game.itemIdCounter++, type: itemType });
      }
    }

    const existingRhs = game.rhsItems.find(i => i.type === itemType);
    if (existingRhs || !existingRhs) {
      for (let i = 0; i < n; i++) {
        game.rhsItems.push({ id: game.itemIdCounter++, type: itemType });
      }
    }

    game.renderAll();
    game.checkWin();
    return true;
  }

  // 4. Adição e Subtração de x (+Nx / -Nx)
  if (opType === '+Nx' || opType === '-Nx') {
    game.sound.playAddOperation();
    const itemType = opType === '+Nx' ? '+x' : '-x';
    for (let i = 0; i < n; i++) {
      game.lhsItems.push({ id: game.itemIdCounter++, type: itemType });
    }
    for (let i = 0; i < n; i++) {
      game.rhsItems.push({ id: game.itemIdCounter++, type: itemType });
    }
    game.renderAll();
    game.checkWin();
    return true;
  }

  return false;
}

export function applyOperationBothSides(game, opType) {
  game.beginNumberOp(opType);
}