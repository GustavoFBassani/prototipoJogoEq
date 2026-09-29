import { divideRational, makeTerm, multiplyRational } from './algebra.js';
import { Operation, Operand } from './keys.js';

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
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;

  s = s.replace(/−/g, '-');
  s = s.replace(/^[×*·÷/:]\s*/, '');

  const xMatch = s.match(/^([+-]?\d*(?:\.\d+)?)x$/);
  if (xMatch) {
    const coeffStr = xMatch[1];
    let coeff;
    if (coeffStr === '' || coeffStr === '+') coeff = 1;
    else if (coeffStr === '-') coeff = -1;
    else coeff = Number(coeffStr);

    if (!Number.isFinite(coeff) || coeff === 0) return null;
    return coeff;
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

export function formatOpDisplay(val, operand, operation = null) {
  const n = typeof val === 'number' ? val : (parseOpNumber(val) ?? 1);
  if (!operation) {
    if (operand === Operand.UNKNOWN) {
      if (n === 1) return 'x';
      if (n === -1) return '-x';
      return `${n}x`;
    }
    return String(n);
  }

  if (operation === Operation.ADD) {
    if (operand === Operand.UNKNOWN) {
      if (n === 1) return '+x';
      if (n === -1) return '-x';
      return `${n > 0 ? '+' : ''}${n}x`;
    }
    return `${n > 0 ? '+' : ''}${n}`;
  }

  if (operation === Operation.SUBTRACT) {
    const mag = Math.abs(n);
    if (operand === Operand.UNKNOWN) {
      if (mag === 1) return '-x';
      return `-${mag}x`;
    }
    return `-${mag}`;
  }

  if (operation === Operation.MULTIPLY) {
    return `×${n}`;
  }

  if (operation === Operation.DIVIDE) {
    return `÷${n}`;
  }

  return String(n);
}

export function applyNumberToBothSides(game, operation, n, operand) {
  if (operation === Operation.MULTIPLY) {
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

  if (operation === Operation.DIVIDE) {
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

  if (operation === Operation.ADD || operation === Operation.SUBTRACT) {
    const kind = operand === Operand.UNKNOWN ? 'variable' : 'constant';
    const signed = operation === Operation.SUBTRACT ? -Math.abs(n) : n;
    const term = makeTerm(kind, signed, 1);

    game.sound.playAddOperation();
    game.lhsItems.push({ id: game.itemIdCounter++, ...term });
    game.rhsItems.push({ id: game.itemIdCounter++, ...term });
    game.renderAll();
    return true;
  }

  return false;
}

export function applyOperationBothSides(game, operation) {
  game.beginOperation(operation);
}
