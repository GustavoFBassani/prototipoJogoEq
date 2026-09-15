import { Operation, Operand } from './keys.js';

export function parseOpNumber(raw, operation) {
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n)) return null;
  if ((operation === Operation.MULTIPLY || operation === Operation.DIVIDE) && n <= 1) {
    return null;
  }
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

function tokenTypeFor(operation, operand) {
  if (operation === Operation.ADD) {
    return operand === Operand.UNKNOWN ? '+x' : '+1';
  }
  if (operation === Operation.SUBTRACT) {
    return operand === Operand.UNKNOWN ? '-x' : '-1';
  }
  return null;
}

export function applyNumberToBothSides(game, operation, n, operand) {
  if (operation === Operation.MULTIPLY) {
    if (n <= 1) {
      game.showOpNote('Escolha um número maior que 1.');
      return false;
    }
    game.sound.playAddOperation();
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

  if (operation === Operation.DIVIDE) {
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
      game.lhsItems = reduceByN(game.lhsItems, n);

      if (canDivideSide(game.rhsItems, n)) {
        game.rhsItems = reduceByN(game.rhsItems, n);
        game.pendingFraction = null;
      } else {
        const totalNum = game.rhsItems.filter(i => i.type === '+1').length - game.rhsItems.filter(i => i.type === '-1').length;

        game.pendingFraction = { num: totalNum, den: n };

        game.rhsItems = [];
      }

      game.renderAll();
      game.checkWin();
      return true;
    }

    game.showOpNote(`Ainda não dá pra dividir por ${n}.`);
    return false;
  }

  if (operation === Operation.ADD || operation === Operation.SUBTRACT) {
    game.sound.playAddOperation();
    game.pendingFraction = null;
    const itemType = tokenTypeFor(operation, operand);
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

export function applyOperationBothSides(game, operation) {
  game.beginOperation(operation);
}
