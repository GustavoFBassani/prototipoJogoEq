import { describe, it, expect } from 'vitest';
import { parseEquation, validateActivity } from '../equation.js';

const v = (num) => ({ kind: 'variable', num, den: 1 });
const c = (num) => ({ kind: 'constant', num, den: 1 });

const phase = (equation, title = 'Fase') => ({ title, hint: '', equation });

describe('parseEquation', () => {
  it('keeps like terms split in written order', () => {
    expect(parseEquation('2x + 3x = 10')).toEqual({ ok: true, lhs: [v(2), v(3)], rhs: [c(10)] });
    expect(parseEquation('1 + 2 + x = 5')).toEqual({
      ok: true,
      lhs: [c(1), c(2), v(1)],
      rhs: [c(5)],
    });
  });

  it('parses x on both sides', () => {
    expect(parseEquation('3x + 2 = x + 8')).toEqual({
      ok: true,
      lhs: [v(3), c(2)],
      rhs: [v(1), c(8)],
    });
  });

  it('parses negatives and a leading +', () => {
    expect(parseEquation('-x - 4 = +2x - 7')).toEqual({
      ok: true,
      lhs: [v(-1), c(-4)],
      rhs: [v(2), c(-7)],
    });
  });

  it('treats unicode minus as hyphen-minus', () => {
    expect(parseEquation('\u22122x = 3 \u2212 x')).toEqual({
      ok: true,
      lhs: [v(-2)],
      rhs: [c(3), v(-1)],
    });
  });

  it('ignores spaces around tokens', () => {
    expect(parseEquation('  2 x -  3 =   4  ')).toEqual({ ok: true, lhs: [v(2), c(-3)], rhs: [c(4)] });
  });

  it('accepts uppercase X', () => {
    expect(parseEquation('2X + X = 9')).toEqual({ ok: true, lhs: [v(2), v(1)], rhs: [c(9)] });
  });

  it('rejects parentheses', () => {
    expect(parseEquation('2(x + 1) = 6').ok).toBe(false);
  });

  it('rejects multiplication with *', () => {
    expect(parseEquation('2*x = 6').ok).toBe(false);
  });

  it('rejects zero coefficient terms', () => {
    expect(parseEquation('0x + 2 = 4').ok).toBe(false);
    expect(parseEquation('x + 0 = 4').ok).toBe(false);
  });

  it('rejects coefficients outside -20..20', () => {
    expect(parseEquation('21x = 4').ok).toBe(false);
    expect(parseEquation('x = -21').ok).toBe(false);
    expect(parseEquation('20x = -20').ok).toBe(true);
  });

  it('rejects other variables, fractions, decimals, empty sides and extra =', () => {
    expect(parseEquation('2y = 4').ok).toBe(false);
    expect(parseEquation('x/2 = 4').ok).toBe(false);
    expect(parseEquation('1.5x = 4').ok).toBe(false);
    expect(parseEquation('2x = ').ok).toBe(false);
    expect(parseEquation('x = 1 = 2').ok).toBe(false);
  });
});

describe('validateActivity', () => {
  it('returns trimmed activity with emitted terms', () => {
    const result = validateActivity({
      name: '  Equações  ',
      phases: [{ title: ' Um ', hint: ' <b>dica</b> ', equation: '2x + 3x = 10' }],
    });
    expect(result).toEqual({
      ok: true,
      activity: {
        name: 'Equações',
        phases: [{ title: 'Um', hint: '<b>dica</b>', lhs: [v(2), v(3)], rhs: [c(10)] }],
      },
    });
  });

  it('rejects already-won equations', () => {
    expect(validateActivity({ name: 'A', phases: [phase('x = 5')] }).ok).toBe(false);
    expect(validateActivity({ name: 'A', phases: [phase('5 = x')] }).ok).toBe(false);
    expect(validateActivity({ name: 'A', phases: [phase('x = 0')] }).ok).toBe(false);
  });

  it('allows solution 0 via x + 1 = 1', () => {
    expect(validateActivity({ name: 'A', phases: [phase('x + 1 = 1')] }).ok).toBe(true);
  });

  it('allows a fractional answer like 4x = -3', () => {
    expect(validateActivity({ name: 'A', phases: [phase('4x = -3')] }).ok).toBe(true);
  });

  it('rejects equal x coefficients on both sides', () => {
    expect(validateActivity({ name: 'A', phases: [phase('2x + 1 = 2x + 3')] }).ok).toBe(false);
    expect(validateActivity({ name: 'A', phases: [phase('x + x = 2x')] }).ok).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(validateActivity({ name: '   ', phases: [phase('2x = 4')] }).ok).toBe(false);
  });

  it('rejects 0 phases', () => {
    expect(validateActivity({ name: 'A', phases: [] }).ok).toBe(false);
  });

  it('rejects 9 phases', () => {
    const phases = Array.from({ length: 9 }, () => phase('2x = 4'));
    expect(validateActivity({ name: 'A', phases }).ok).toBe(false);
    expect(validateActivity({ name: 'A', phases: phases.slice(0, 8) }).ok).toBe(true);
  });

  it('rejects a missing title', () => {
    expect(validateActivity({ name: 'A', phases: [{ hint: '', equation: '2x = 4' }] }).ok).toBe(false);
    expect(validateActivity({ name: 'A', phases: [phase('2x = 4', '  ')] }).ok).toBe(false);
  });

  it('rejects an equation that does not parse', () => {
    expect(validateActivity({ name: 'A', phases: [phase('2(x) = 4')] }).ok).toBe(false);
  });
});
