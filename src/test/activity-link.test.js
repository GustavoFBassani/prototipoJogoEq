import { describe, it, expect } from 'vitest';
import {
  encodeStudentActivity,
  encodeEditorDraft,
  decodeStudentActivity,
  decodeEditorDraft,
  readSearch,
  buildStudentUrl,
  buildEditorUrl,
} from '../activity-link.js';

const activity = {
  v: 1,
  name: 'Equações da turma 7ºB — ção ✓',
  phases: [
    {
      title: 'Fase 1',
      hint: 'Isole o x',
      lhs: [
        { kind: 'variable', num: 2, den: 1 },
        { kind: 'constant', num: 3, den: 1 },
      ],
      rhs: [{ kind: 'constant', num: -3, den: 4 }],
    },
  ],
};

const draft = {
  v: 1,
  name: 'Rascunho',
  phases: [
    { title: 'Fase 1', hint: '', equation: '2x + 3 = 7' },
    { title: 'Fase 2', hint: 'meio pronta', equation: '3x - 1/2 =' },
  ],
};

const ORIGIN = 'https://example.org';
const PATH = '/jogo/';

const encodeRaw = (value) => encodeEditorDraft(value);

describe('payload encoding', () => {
  it('round-trips a student activity', () => {
    expect(decodeStudentActivity(encodeStudentActivity(activity))).toEqual(activity);
  });

  it('round-trips an editor draft', () => {
    expect(decodeEditorDraft(encodeEditorDraft(draft))).toEqual(draft);
  });

  it('preserves a half-typed equation string', () => {
    const decoded = decodeEditorDraft(encodeEditorDraft(draft));
    expect(decoded.phases[1].equation).toBe('3x - 1/2 =');
  });

  it('uses only the base64url alphabet without padding', () => {
    for (let i = 0; i < 40; i++) {
      const payload = encodeEditorDraft({ ...draft, name: '?>~ÿ'.repeat(i) + 'é'.repeat(i % 3) });
      expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(payload).not.toMatch(/[+/=]/);
    }
    expect(encodeStudentActivity(activity)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('returns null on bad input without throwing', () => {
    expect(decodeStudentActivity('!!!')).toBeNull();
    expect(decodeStudentActivity('a+b/')).toBeNull();
    expect(decodeStudentActivity(encodeRaw('not json').slice(0, -2) + '@@')).toBeNull();
    expect(decodeStudentActivity(btoa('{oops').replace(/=+$/, ''))).toBeNull();
    expect(decodeStudentActivity(encodeRaw({ ...activity, v: 2 }))).toBeNull();
    expect(decodeStudentActivity(encodeRaw({ v: 1, name: 'x' }))).toBeNull();
    expect(
      decodeStudentActivity(
        encodeRaw({ v: 1, name: 'x', phases: [{ title: 't', hint: 'h', lhs: [{ kind: 'x', num: 1, den: 1 }], rhs: [] }] }),
      ),
    ).toBeNull();
    expect(decodeEditorDraft(encodeRaw({ v: 1, name: 'x', phases: [{ title: 't', hint: 'h', equation: 3 }] }))).toBeNull();
    expect(decodeEditorDraft(encodeStudentActivity(activity))).toBeNull();
    expect(decodeStudentActivity(encodeEditorDraft(draft))).toBeNull();
    expect(decodeStudentActivity(undefined)).toBeNull();
  });
});

describe('readSearch', () => {
  const a = encodeStudentActivity(activity);
  const d = encodeEditorDraft(draft);

  it('returns campaign when there is no a', () => {
    expect(readSearch('')).toEqual({ mode: 'campaign' });
    expect(readSearch('?foo=1')).toEqual({ mode: 'campaign' });
  });

  it('returns play with a valid a', () => {
    expect(readSearch(`?a=${a}`)).toEqual({ mode: 'play', activity });
  });

  it('falls back to campaign when a is invalid', () => {
    expect(readSearch('?a=garbage!!')).toEqual({ mode: 'campaign' });
    expect(readSearch('?a=')).toEqual({ mode: 'campaign' });
  });

  it('returns editor with a null draft when editar has no d', () => {
    expect(readSearch('?editar')).toEqual({ mode: 'editor', draft: null });
    expect(readSearch('?editar=')).toEqual({ mode: 'editor', draft: null });
    expect(readSearch('?editar&d=broken')).toEqual({ mode: 'editor', draft: null });
  });

  it('returns editor with the decoded draft', () => {
    expect(readSearch(`?editar&d=${d}`)).toEqual({ mode: 'editor', draft });
  });

  it('lets editar win over a', () => {
    expect(readSearch(`?a=${a}&editar`)).toEqual({ mode: 'editor', draft: null });
    expect(readSearch(`?a=${a}&editar&d=${d}`)).toEqual({ mode: 'editor', draft });
  });

  it('accepts search strings with or without a leading ?', () => {
    expect(readSearch(`a=${a}`)).toEqual({ mode: 'play', activity });
    expect(readSearch(`editar&d=${d}`)).toEqual({ mode: 'editor', draft });
  });
});

describe('URL builders', () => {
  it('buildStudentUrl carries only a', () => {
    const url = new URL(buildStudentUrl(ORIGIN, PATH, activity));
    expect(url.origin + url.pathname).toBe(ORIGIN + PATH);
    expect([...url.searchParams.keys()]).toEqual(['a']);
    expect(url.searchParams.has('editar')).toBe(false);
    expect(url.searchParams.has('d')).toBe(false);
    expect(readSearch(url.search)).toEqual({ mode: 'play', activity });
  });

  it('buildEditorUrl carries editar and d', () => {
    const url = new URL(buildEditorUrl(ORIGIN, PATH, draft));
    expect(url.origin + url.pathname).toBe(ORIGIN + PATH);
    expect(url.searchParams.has('editar')).toBe(true);
    expect(url.searchParams.has('d')).toBe(true);
    expect(url.searchParams.has('a')).toBe(false);
    expect(readSearch(url.search)).toEqual({ mode: 'editor', draft });
  });
});
