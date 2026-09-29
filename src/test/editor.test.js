import { describe, it, expect } from 'vitest';
import {
  MAX_PHASES,
  UNRECOGNIZED_NOTE,
  blankDraft,
  draftFromActivity,
  draftFromStorage,
  initialDraft,
  classLinkState,
  acceptPastedLink,
  addPhase,
  removePhase,
  movePhase,
  canAddPhase,
  canRemovePhase,
  setPhaseField,
} from '../editor.js';
import {
  buildEditorUrl,
  buildStudentUrl,
  decodeStudentActivity,
  readSearch,
} from '../activity-link.js';

const ORIGIN = 'https://equalab.test';
const PATH = '/lab/';

function draftWith(phases, name = 'Turma') {
  return { v: 1, name, phases };
}

function phase(title, equation, hint = '') {
  return { title, hint, equation };
}

function payloadOf(url) {
  return new URL(url).searchParams.get('a');
}

describe('blankDraft', () => {
  it('starts with an empty name and one empty phase', () => {
    expect(blankDraft()).toEqual({ v: 1, name: '', phases: [{ title: '', hint: '', equation: '' }] });
  });
});

describe('classLinkState', () => {
  it('leaves the link empty and explains why while the equation is half typed', () => {
    const state = classLinkState(draftWith([phase('Soma', '2x +')]), ORIGIN, PATH);
    expect(state.value).toBe('');
    expect(state.note).toMatch(/^Fase 1: /);
  });

  it('builds a student link with only ?a= for a valid activity', () => {
    const state = classLinkState(draftWith([phase('Soma', '2x + 3 = 11')]), ORIGIN, PATH);
    expect(state.note).toBe('');
    expect(state.value.startsWith(`${ORIGIN}${PATH}?a=`)).toBe(true);
    expect([...new URL(state.value).searchParams.keys()]).toEqual(['a']);

    const activity = decodeStudentActivity(payloadOf(state.value));
    expect(activity.name).toBe('Turma');
    expect(activity.phases[0].title).toBe('Soma');
  });

  it('keeps 2x + 3x as two terms inside the encoded activity', () => {
    const state = classLinkState(draftWith([phase('Junta', '2x + 3x = 10')]), ORIGIN, PATH);
    const activity = decodeStudentActivity(payloadOf(state.value));
    expect(activity.phases[0].lhs).toHaveLength(2);
  });
});

describe('phase list guards', () => {
  it('stops adding at 8 phases', () => {
    let draft = blankDraft();
    for (let i = 0; i < 12; i++) draft = addPhase(draft);
    expect(draft.phases).toHaveLength(MAX_PHASES);
    expect(canAddPhase(draft)).toBe(false);
    expect(addPhase(draft)).toBe(draft);
  });

  it('never removes the last phase', () => {
    const draft = blankDraft();
    expect(canRemovePhase(draft)).toBe(false);
    expect(removePhase(draft, 0)).toBe(draft);

    const two = draftWith([phase('A', ''), phase('B', '')]);
    expect(removePhase(two, 0).phases).toEqual([phase('B', '')]);
  });

  it('moves a phase up and down and ignores moves past the edges', () => {
    const draft = draftWith([phase('A', ''), phase('B', ''), phase('C', '')]);
    const titles = (d) => d.phases.map((p) => p.title);

    expect(titles(movePhase(draft, 1, -1))).toEqual(['B', 'A', 'C']);
    expect(titles(movePhase(draft, 1, 1))).toEqual(['A', 'C', 'B']);
    expect(movePhase(draft, 0, -1)).toBe(draft);
    expect(movePhase(draft, 2, 1)).toBe(draft);
  });
});

describe('acceptPastedLink', () => {
  const current = draftWith([phase('Atual', '')], 'Rascunho');

  it('replaces the draft from a student URL and rebuilds the equation text', () => {
    const activity = {
      v: 1,
      name: 'Turma B',
      phases: [
        {
          title: 'Dois lados',
          hint: 'Tire 3',
          lhs: [
            { kind: 'variable', num: 2, den: 1 },
            { kind: 'constant', num: 3, den: 1 },
          ],
          rhs: [{ kind: 'constant', num: -11, den: 1 }],
        },
      ],
    };
    const result = acceptPastedLink(current, buildStudentUrl(ORIGIN, PATH, activity));
    expect(result.recognized).toBe(true);
    expect(result.draft).toEqual(draftWith([phase('Dois lados', '2x + 3 = -11', 'Tire 3')], 'Turma B'));
  });

  it('accepts a raw student payload', () => {
    const url = classLinkState(draftWith([phase('Soma', '2x + 3 = 11')]), ORIGIN, PATH).value;
    const result = acceptPastedLink(current, payloadOf(url));
    expect(result.recognized).toBe(true);
    expect(result.draft.phases[0].equation).toBe('2x + 3 = 11');
  });

  it('loads an editor URL draft', () => {
    const draft = draftWith([phase('Meio', '3x -')], 'Outra');
    const result = acceptPastedLink(current, buildEditorUrl(ORIGIN, PATH, draft));
    expect(result).toEqual({ draft, recognized: true });
  });

  it('does not recognize "oi" and keeps the same draft', () => {
    const result = acceptPastedLink(current, 'oi');
    expect(result.recognized).toBe(false);
    expect(result.draft).toBe(current);
    expect(UNRECOGNIZED_NOTE).toBe('Não reconheci esse link.');
  });
});

describe('draft persistence', () => {
  it('round-trips a half-typed equation through buildEditorUrl and readSearch', () => {
    const draft = setPhaseField(blankDraft(), 0, 'equation', '2x + ');
    const url = new URL(buildEditorUrl(ORIGIN, PATH, draft));
    const route = readSearch(url.search);
    expect(route.mode).toBe('editor');
    expect(route.draft).toEqual(draft);
    expect(initialDraft(route, null)).toEqual(draft);
  });

  it('prefers the URL draft, then storage, then blank', () => {
    const fromUrl = draftWith([phase('URL', '')]);
    const stored = JSON.stringify(draftWith([phase('Guardado', 'x = ')]));

    expect(initialDraft({ mode: 'editor', draft: fromUrl }, stored)).toEqual(fromUrl);
    expect(initialDraft({ mode: 'editor', draft: null }, stored).phases[0].title).toBe('Guardado');
    expect(initialDraft({ mode: 'editor', draft: null }, null)).toEqual(blankDraft());
  });

  it('ignores stored values that are not editor drafts', () => {
    expect(draftFromStorage('not json')).toBeNull();
    expect(draftFromStorage(JSON.stringify({ v: 1, name: 'x', phases: [{ title: 'a' }] }))).toBeNull();
  });

  it('turns an activity without phases into one blank phase', () => {
    expect(draftFromActivity({ v: 1, name: 'Vazia', phases: [] }).phases).toEqual(blankDraft().phases);
  });
});
