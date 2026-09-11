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

export function parseOpNumber(raw) {
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n) || n <= 1) return null;
  return n;
}

export function applyNumberToBothSides(game, opType, n) {
  const isMult = opType === '*N';

  if (isMult) {
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
    return true;
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
    game.particles.createDustExplosion(
      window.innerWidth * 0.3,
      window.innerHeight * 0.5,
      '#f59e0b',
      '#38bdf8'
    );
    game.particles.createDustExplosion(
      window.innerWidth * 0.7,
      window.innerHeight * 0.5,
      '#f59e0b',
      '#c084fc'
    );
    game.renderAll();
    return true;
  }

  game.showOpNote(`Ainda não dá pra dividir por ${n}. Os grupos não estão iguais.`);
  return false;
}

export function applyOperationBothSides(game, opType) {
  if (opType === '*N' || opType === '/N') {
    game.beginNumberOp(opType);
    return;
  }

  game.sound.playAddOperation();
  game.lhsItems.push({ id: game.itemIdCounter++, type: opType });
  game.rhsItems.push({ id: game.itemIdCounter++, type: opType });
  game.renderAll();
}
