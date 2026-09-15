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

// Formata o lado da equação considerando se há uma fração pendente (ex: -3/4)
export function formatSideWithFraction(items, pendingFraction) {
  if (pendingFraction) {
    let { num, den } = pendingFraction;
    if (den < 0) {
      num = -num;
      den = -den;
    }
    // Simplifica a fração para exibição correta
    const divisor = gcd(num, den);
    num = num / divisor;
    den = den / divisor;

    if (den === 1) return String(num);
    return `${num}/${den}`;
  }
  return formatAlgebraicSide(items);
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
    ((isolated.posX === 1 && isolated.negX === 0) || (isolated.posX === 0 && isolated.negX === 1)) &&
    isolated.pos1 === 0 &&
    isolated.neg1 === 0 &&
    other.posX === 0 &&
    other.negX === 0 &&
    (other.pos1 === 0 || other.neg1 === 0)
  );
}

// Função auxiliar para calcular o máximo divisor comum (MDC) para simplificação de frações
function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

// Função para calcular a representação de fração ou número inteiro do resultado (ex: -3/4)
export function calculateFractionResult(tokensX, tokensNum, pendingFraction) {
  if (pendingFraction) {
    let { num, den } = pendingFraction;
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const divisor = gcd(num, den);
    num = num / divisor;
    den = den / divisor;

    if (den === 1) return String(num);
    return `${num}/${den}`;
  }

  const totalX = tokensX.posX - tokensX.negX;
  const totalNum = tokensNum.pos1 - tokensNum.neg1;

  if (totalX === 0) return '0';
  if (totalNum % totalX === 0) return String(totalNum / totalX);

  let num = totalNum;
  let den = totalX;

  if (den < 0) {
    num = -num;
    den = -den;
  }

  const divisor = gcd(num, den);
  num = num / divisor;
  den = den / divisor;

  return `${num}/${den}`;
}