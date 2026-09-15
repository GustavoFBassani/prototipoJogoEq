export function parseOpNumber(raw, opType) {
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n)) return null;
  if ((opType === '*N' || opType === '/N') && n <= 1) return null;
  if (n <= 0) return null;
  return n;
}

function canDivideSide(items, n) {
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
  if (opType === '*N') {
    if (n <= 1) {
      game.showOpNote('Escolha um número maior que 1.');
      return false;
    }
    game.sound.playAddOperation();
    
    // Se multiplicar, qualquer fração pendente deixa de existir estruturalmente
    game.pendingFraction = null;

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

  if (opType === '/N') {
    if (n <= 1) {
      game.showOpNote('Escolha um número maior que 1.');
      return false;
    }

    if (game.lhsItems.length > 0 || game.rhsItems.length > 0) {
      if (!canDivideSide(game.lhsItems, n)) {
        game.showOpNote(`O lado esquerdo não pode ser dividido exato por ${n}.`);
        return false;
      }

      game.sound.playAddOperation();
      
      // Reduz o lado esquerdo
      game.lhsItems = reduceByN(game.lhsItems, n);

      // Verifica o lado direito
      if (canDivideSide(game.rhsItems, n)) {
        game.rhsItems = reduceByN(game.rhsItems, n);
        game.pendingFraction = null; // Limpa se a divisão foi exata em ambos
      } else {
        // Divisão não exata: calcula o valor total atual do RHS
        const totalNum = game.rhsItems.filter(i => i.type === '+1').length - game.rhsItems.filter(i => i.type === '-1').length;
        
        // Salvamos a fração pendente
        game.pendingFraction = { num: totalNum, den: n };

        // Limpamos o RHS visualmente
        game.rhsItems = []; 
      }

      game.renderAll();
      game.checkWin();
      return true;
    }

    game.showOpNote(`Ainda não dá pra dividir por ${n}.`);
    return false;
  }

  if (opType === '+N' || opType === '-N') {
    game.sound.playAddOperation();
    game.pendingFraction = null; // Operações de adição/subtração limpam frações passadas
    
    const itemType = opType === '+N' ? '+1' : '-1';
    for (let i = 0; i < n; i++) {
      game.lhsItems.push({ id: game.itemIdCounter++, type: itemType });
      game.rhsItems.push({ id: game.itemIdCounter++, type: itemType });
    }
    game.renderAll();
    game.checkWin();
    return true;
  }

  if (opType === '+Nx' || opType === '-Nx') {
    game.sound.playAddOperation();
    game.pendingFraction = null;

    const itemType = opType === '+Nx' ? '+x' : '-x';
    for (let i = 0; i < n; i++) {
      game.lhsItems.push({ id: game.itemIdCounter++, type: itemType });
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