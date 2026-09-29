export function normalizeRational(num, den) {
  if (num === 0) return { num: 0, den: 1 };
  if (den < 0) {
    num = -num;
    den = -den;
  }
  if (num % den === 0) {
    return { num: num / den, den: 1 };
  }
  return { num, den };
}

export function addRationals(n1, d1, n2, d2) {
  if (d1 === d2) {
    return normalizeRational(n1 + n2, d1);
  }
  return normalizeRational(n1 * d2 + n2 * d1, d1 * d2);
}

export function multiplyRational(n, d, factor) {
  return normalizeRational(n * factor, d);
}

export function divideRational(n, d, divisor) {
  if (divisor === 0) {
    throw new Error('Divisão por zero não é permitida!');
  }
  if (divisor < 0) {
    n = -n;
    divisor = -divisor;
  }
  return normalizeRational(n, d * divisor);
}

export function makeTerm(kind, num, den = 1) {
  const rational = normalizeRational(num, den);
  return { kind, num: rational.num, den: rational.den };
}

function formatTerm(item, index) {
  const isVar = item.kind === 'variable';
  const isFrac = item.den > 1;
  const absNum = Math.abs(item.num);
  const isNegative = item.num < 0;

  let termStr = '';
  if (isFrac) {
    termStr = isVar ? `${absNum}/${item.den}x` : `${absNum}/${item.den}`;
  } else if (isVar) {
    termStr = absNum === 1 ? 'x' : `${absNum}x`;
  } else {
    termStr = `${absNum}`;
  }

  if (index === 0) {
    return isNegative ? `-${termStr}` : termStr;
  }
  return isNegative ? `- ${termStr}` : `+ ${termStr}`;
}

export function formatAlgebraicSide(items) {
  if (items.length === 0) return '0';
  return items.map((item, index) => formatTerm(item, index)).join(' ');
}

export function formatSolution(constTerm) {
  if (constTerm.den > 1) {
    const sign = constTerm.num < 0 ? '-' : '';
    return `x = ${sign}${Math.abs(constTerm.num)}/${constTerm.den}`;
  }
  return `x = ${constTerm.num}`;
}

function isUnitX(item) {
  return item.kind === 'variable' && item.num === 1 && item.den === 1;
}

export function winningConstant(lhs, rhs) {
  if (lhs.length !== 1 || rhs.length !== 1) return null;
  if (isUnitX(lhs[0]) && rhs[0].kind === 'constant') return rhs[0];
  if (isUnitX(rhs[0]) && lhs[0].kind === 'constant') return lhs[0];
  return null;
}

export function minimumSteps(lhs, rhs) {
  const totals = { variable: [0, 0], constant: [0, 0] };
  for (const [side, items] of [lhs, rhs].entries()) {
    for (const item of items) {
      totals[item.kind][side] += item.num / item.den;
    }
  }

  const [leftX, rightX] = totals.variable;
  const [leftConstant, rightConstant] = totals.constant;
  if (leftX === rightX) return 0;

  const coefficientOnLeft = leftX - rightX;
  const keepLeftCost =
    (rightX !== 0 ? 1 : 0) +
    (leftConstant !== 0 ? 1 : 0) +
    (coefficientOnLeft !== 1 ? 1 : 0);
  const keepRightCost =
    (leftX !== 0 ? 1 : 0) +
    (rightConstant !== 0 ? 1 : 0) +
    (coefficientOnLeft !== -1 ? 1 : 0);
  return Math.min(keepLeftCost, keepRightCost);
}

export function resolveDrop(source, target) {
  if (!source || !target || source.kind !== target.kind) return null;
  const sum = addRationals(source.num, source.den, target.num, target.den);
  if (sum.num === 0) return { action: 'annihilate' };
  const sameSign = source.num > 0 === target.num > 0;
  return { action: sameSign ? 'fuse' : 'cancel', num: sum.num, den: sum.den };
}

export function getTokenColors(item) {
  if (item.kind === 'variable') {
    return item.num > 0
      ? { main: '#25527a', glow: '#4f8b9e' }
      : { main: '#9e3538', glow: '#c85356' };
  }
  return item.num > 0
    ? { main: '#387b5c', glow: '#519e7a' }
    : { main: '#c85f28', glow: '#e07b39' };
}

export function getTokenClasses(item) {
  if (item.kind === 'variable') {
    return item.num > 0 ? 'token-pos-x' : 'token-neg-x';
  }
  return item.num > 0 ? 'token-pos-1' : 'token-neg-1';
}

export function renderTokenContent(item) {
  const isVar = item.kind === 'variable';
  const sign = item.num > 0 ? '+' : '-';
  const absNum = Math.abs(item.num);
  const isFrac = item.den > 1;

  if (isFrac) {
    return `
      <div class="frac-container">
        <span>${sign}</span>
        <div class="frac-stack">
          <span class="frac-num">${absNum}</span>
          <span class="frac-den">${item.den}</span>
        </div>
        ${isVar ? '<span>x</span>' : ''}
      </div>
    `;
  }

  if (isVar) {
    return `<span>${absNum === 1 ? `${sign}x` : `${sign}${absNum}x`}</span>`;
  }
  return `<span>${sign}${absNum}</span>`;
}
