import { divideRational, makeTerm, multiplyRational } from './algebra.js';

function burstBothSides(game) {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth;
  const height = typeof window === 'undefined' ? 0 : window.innerHeight;
  game.particles.createDustExplosion(width * 0.3, height * 0.5, '#f59e0b', '#38bdf8');
  game.particles.createDustExplosion(width * 0.7, height * 0.5, '#f59e0b', '#c084fc');
}

function scaleItems(items, mutate) {
  return items.map((item) => {
    const next = mutate(item.num, item.den);
    return { ...item, num: next.num, den: next.den };
  });
}

export function parseOpNumber(raw) {
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

export function applyNumberToBothSides(game, opType, n) {
  if (opType === '*N') {
    game.sound.playAddOperation();
    game.lhsItems = scaleItems(game.lhsItems, (num, den) =>
      multiplyRational(num, den, n)
    );
    game.rhsItems = scaleItems(game.rhsItems, (num, den) =>
      multiplyRational(num, den, n)
    );
    burstBothSides(game);
    game.renderAll();
    return true;
  }

  if (opType === '/N') {
    game.sound.playAddOperation();
    game.lhsItems = scaleItems(game.lhsItems, (num, den) =>
      divideRational(num, den, n)
    );
    game.rhsItems = scaleItems(game.rhsItems, (num, den) =>
      divideRational(num, den, n)
    );
    burstBothSides(game);
    game.renderAll();
    return true;
  }

  const kind = opType === '+Nx' || opType === '-Nx' ? 'variable' : 'constant';
  const signed = opType === '-N' || opType === '-Nx' ? -n : n;
  const term = makeTerm(kind, signed, 1);

  game.sound.playAddOperation();
  game.lhsItems.push({ id: game.itemIdCounter++, ...term });
  game.rhsItems.push({ id: game.itemIdCounter++, ...term });
  game.renderAll();
  return true;
}

export function applyOperationBothSides(game, opType) {
  game.beginNumberOp(opType);
}
