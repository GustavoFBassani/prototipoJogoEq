import { winningConstant } from './algebra.js';

const MAX_COEFFICIENT = 20;
const MAX_PHASES = 8;

function fail(reason) {
  return { ok: false, reason };
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isSpace(ch) {
  return /\s/.test(ch);
}

function checkCharacters(text) {
  if (/[()[\]{}]/.test(text)) return 'Parênteses não são permitidos.';
  if (/[*×·]/.test(text)) return 'Use apenas somas de termos, sem multiplicação.';
  if (/[/÷]/.test(text)) return 'Frações não são permitidas.';
  if (/[.,]/.test(text)) return 'Números decimais não são permitidos.';
  if (/[a-wyzA-WYZ]/.test(text)) return 'A única variável permitida é x.';
  if (/[^0-9xX+\-=\s]/.test(text)) return 'A equação tem caracteres inválidos.';
  return null;
}

function parseSide(text) {
  const terms = [];
  let i = 0;
  const skipSpaces = () => {
    while (i < text.length && isSpace(text[i])) i++;
  };

  skipSpaces();
  if (i >= text.length) return fail('Os dois lados da equação precisam ter termos.');

  while (i < text.length) {
    let sign = 1;
    if (text[i] === '+' || text[i] === '-') {
      if (text[i] === '-') sign = -1;
      i++;
      skipSpaces();
    } else if (terms.length > 0) {
      return fail('Separe os termos com + ou -.');
    }

    let digits = '';
    while (i < text.length && isDigit(text[i])) digits += text[i++];
    skipSpaces();

    let isVariable = false;
    if (text[i] === 'x' || text[i] === 'X') {
      isVariable = true;
      i++;
      skipSpaces();
    }

    if (digits === '' && !isVariable) return fail('Há um sinal sem termo na equação.');

    const magnitude = digits === '' ? 1 : Number(digits);
    const num = sign * magnitude;
    if (num === 0) return fail('Termos com coeficiente 0 não são permitidos.');
    if (Math.abs(num) > MAX_COEFFICIENT) {
      return fail(`Os coeficientes devem ficar entre -${MAX_COEFFICIENT} e ${MAX_COEFFICIENT}.`);
    }

    terms.push({ kind: isVariable ? 'variable' : 'constant', num, den: 1 });
  }

  return { ok: true, terms };
}

export function parseEquation(text) {
  if (typeof text !== 'string' || text.trim() === '') return fail('Escreva uma equação.');
  const normalized = text.replace(/\u2212/g, '-');

  const charError = checkCharacters(normalized);
  if (charError) return fail(charError);

  const parts = normalized.split('=');
  if (parts.length !== 2) return fail('A equação precisa ter exatamente um sinal de =.');

  const left = parseSide(parts[0]);
  if (!left.ok) return left;
  const right = parseSide(parts[1]);
  if (!right.ok) return right;

  return { ok: true, lhs: left.terms, rhs: right.terms };
}

function sumSide(terms) {
  let a = 0;
  let b = 0;
  for (const term of terms) {
    if (term.kind === 'variable') a += term.num;
    else b += term.num;
  }
  return { a, b };
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateActivity({ name, phases } = {}) {
  const activityName = trimmed(name);
  if (activityName === '') return fail('Dê um nome para a atividade.');

  if (!Array.isArray(phases) || phases.length < 1 || phases.length > MAX_PHASES) {
    return fail(`A atividade precisa ter de 1 a ${MAX_PHASES} fases.`);
  }

  const validPhases = [];
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index] ?? {};
    const label = `Fase ${index + 1}`;

    const title = trimmed(phase.title);
    if (title === '') return fail(`${label}: dê um título para a fase.`);

    const parsed = parseEquation(phase.equation);
    if (!parsed.ok) return fail(`${label}: ${parsed.reason}`);

    if (winningConstant(parsed.lhs, parsed.rhs) !== null) {
      return fail(`${label}: a equação já está resolvida.`);
    }

    const left = sumSide(parsed.lhs);
    const right = sumSide(parsed.rhs);
    if (left.a === right.a) {
      return fail(`${label}: a equação precisa ter exatamente uma solução.`);
    }

    validPhases.push({ title, hint: trimmed(phase.hint), lhs: parsed.lhs, rhs: parsed.rhs });
  }

  return { ok: true, activity: { name: activityName, phases: validPhases } };
}
