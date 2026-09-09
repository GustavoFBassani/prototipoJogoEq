export function areOpposites(typeA, typeB) {
  return (
    (typeA === '+1' && typeB === '-1') ||
    (typeA === '-1' && typeB === '+1') ||
    (typeA === '+x' && typeB === '-x') ||
    (typeA === '-x' && typeB === '+x')
  );
}

export function getTokenColors(type) {
  switch (type) {
    case '+x':
      return { main: '#0284c7', glow: '#38bdf8' };
    case '-x':
      return { main: '#ea580c', glow: '#fb923c' };
    case '+1':
      return { main: '#16a34a', glow: '#4ade80' };
    case '-1':
      return { main: '#9333ea', glow: '#c084fc' };
    default:
      return { main: '#94a3b8', glow: '#e2e8f0' };
  }
}

export function formatAlgebraicSide(items) {
  if (items.length === 0) return '0';

  let countX = 0;
  let countNum = 0;

  items.forEach((item) => {
    if (item.type === '+x') countX += 1;
    if (item.type === '-x') countX -= 1;
    if (item.type === '+1') countNum += 1;
    if (item.type === '-1') countNum -= 1;
  });

  if (countX === 0 && countNum === 0) return '0';

  const parts = [];

  if (countX !== 0) {
    if (countX === 1) parts.push('x');
    else if (countX === -1) parts.push('-x');
    else parts.push(`${countX}x`);
  }

  if (countNum !== 0) {
    if (parts.length > 0) {
      if (countNum > 0) parts.push(`+ ${countNum}`);
      else parts.push(`- ${Math.abs(countNum)}`);
    } else {
      parts.push(`${countNum}`);
    }
  }

  return parts.join(' ');
}

export function countTokens(items) {
  return {
    posX: items.filter((i) => i.type === '+x').length,
    negX: items.filter((i) => i.type === '-x').length,
    pos1: items.filter((i) => i.type === '+1').length,
    neg1: items.filter((i) => i.type === '-1').length,
  };
}

export function isIsolatedX(isolated, other) {
  return (
    isolated.posX === 1 &&
    isolated.negX === 0 &&
    isolated.pos1 === 0 &&
    isolated.neg1 === 0 &&
    other.posX === 0 &&
    other.negX === 0 &&
    (other.pos1 === 0 || other.neg1 === 0)
  );
}
