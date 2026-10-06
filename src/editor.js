import { formatAlgebraicSide } from './algebra.js';
import { validateActivity } from './equation.js';
import {
  buildEditorUrl,
  buildStudentUrl,
  decodeEditorDraft,
  decodeStudentActivity,
  encodeEditorDraft,
  readSearch,
} from './activity-link.js';

export const MAX_PHASES = 8;
export const MIN_PHASES = 1;
export const STORAGE_KEY = 'equalab.editorDraft';
export const UNRECOGNIZED_NOTE = 'Não reconheci esse link.';

export function blankPhase() {
  return { title: '', hint: '', equation: '', minSteps: '' };
}

export function blankDraft() {
  return { v: 1, name: '', phases: [blankPhase()] };
}

export function normalizeDraft(draft) {
  const phases = draft.phases
    .slice(0, MAX_PHASES)
    .map(({ title, hint, equation, minSteps }) => ({ title, hint, equation, minSteps: minSteps ?? '' }));
  return { v: 1, name: draft.name, phases: phases.length > 0 ? phases : [blankPhase()] };
}

export function draftFromActivity(activity) {
  return normalizeDraft({
    name: activity.name,
    phases: activity.phases.map(({ title, hint, lhs, rhs, minSteps }) => ({
      title,
      hint,
      equation: `${formatAlgebraicSide(lhs)} = ${formatAlgebraicSide(rhs)}`,
      minSteps: minSteps ?? '',
    })),
  });
}

export function draftFromStorage(text) {
  if (typeof text !== 'string') return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  const draft = decodeEditorDraft(encodeEditorDraft(value));
  return draft ? normalizeDraft(draft) : null;
}

export function initialDraft(route, storedText) {
  if (route.draft) return normalizeDraft(route.draft);
  return draftFromStorage(storedText) ?? blankDraft();
}

export function classLinkState(draft, origin, pathname) {
  const result = validateActivity({ name: draft.name, phases: draft.phases });
  if (!result.ok) return { value: '', note: result.reason };
  return { value: buildStudentUrl(origin, pathname, { v: 1, ...result.activity }), note: '' };
}

function queryOf(text) {
  const withoutHash = text.split('#')[0];
  const question = withoutHash.indexOf('?');
  if (question !== -1) return withoutHash.slice(question);
  return withoutHash.includes('=') ? `?${withoutHash}` : null;
}

export function acceptPastedLink(draft, text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed === '') return { draft, recognized: false };

  const query = queryOf(trimmed);
  if (query !== null) {
    const route = readSearch(query);
    if (route.mode === 'editor' && route.draft) {
      return { draft: normalizeDraft(route.draft), recognized: true };
    }
    if (route.mode === 'play') {
      return { draft: draftFromActivity(route.activity), recognized: true };
    }
  }

  const activity = decodeStudentActivity(trimmed);
  if (activity) return { draft: draftFromActivity(activity), recognized: true };

  return { draft, recognized: false };
}

export function canAddPhase(draft) {
  return draft.phases.length < MAX_PHASES;
}

export function canRemovePhase(draft) {
  return draft.phases.length > MIN_PHASES;
}

export function addPhase(draft) {
  if (!canAddPhase(draft)) return draft;
  return { ...draft, phases: [...draft.phases, blankPhase()] };
}

export function removePhase(draft, index) {
  if (!canRemovePhase(draft) || index < 0 || index >= draft.phases.length) return draft;
  return { ...draft, phases: draft.phases.filter((_, i) => i !== index) };
}

export function movePhase(draft, index, delta) {
  const target = index + delta;
  const { length } = draft.phases;
  if (index < 0 || index >= length || target < 0 || target >= length || target === index) return draft;
  const phases = [...draft.phases];
  [phases[index], phases[target]] = [phases[target], phases[index]];
  return { ...draft, phases };
}

export function setName(draft, name) {
  return { ...draft, name };
}

export function setPhaseField(draft, index, field, value) {
  if (!(field in blankPhase()) || index < 0 || index >= draft.phases.length) return draft;
  const phases = draft.phases.map((phase, i) => (i === index ? { ...phase, [field]: value } : phase));
  return { ...draft, phases };
}

const PHASE_FIELDS = [
  { field: 'title', label: 'Título', placeholder: 'Ex.: Somando dos dois lados' },
  { field: 'equation', label: 'Equação', placeholder: '2x + 3 = 11', mono: true },
  { field: 'hint', label: 'Dica (opcional)', placeholder: 'Ex.: Comece tirando o 3 dos dois lados' },
  { field: 'minSteps', label: 'Passos otimizados (opcional)', placeholder: 'Ex.: 4', type: 'number', min: '1' },
];

const PHASE_TOOLS = [
  { action: 'up', label: 'Subir' },
  { action: 'down', label: 'Descer' },
  { action: 'remove', label: 'Apagar' },
];

function readStorage(storage) {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(storage, draft) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or blocked: the address bar still holds the draft */
  }
}

export function mountEditor({ root, win = globalThis }) {
  const doc = root.ownerDocument;
  const storage = win.localStorage;
  const { origin, pathname } = win.location;

  const nameInput = root.querySelector('#editor-name');
  const list = root.querySelector('#editor-phases');
  const addButton = root.querySelector('#editor-add');
  const linkInput = root.querySelector('#editor-class-link');
  const copyButton = root.querySelector('#editor-copy');
  const note = root.querySelector('#editor-link-note');

  let draft = initialDraft(readSearch(win.location.search), readStorage(storage));

  function persist() {
    win.history.replaceState(null, '', buildEditorUrl(origin, pathname, draft));
    writeStorage(storage, draft);
  }

  function showLink({ force = false } = {}) {
    const state = classLinkState(draft, origin, pathname);
    if (force || doc.activeElement !== linkInput) linkInput.value = state.value;
    note.textContent = state.note;
    copyButton.disabled = state.value === '';
  }

  function phaseRow(phase, index) {
    const item = doc.createElement('li');
    item.className = 'editor-phase';

    const head = doc.createElement('div');
    head.className = 'editor-phase-head';
    const number = doc.createElement('span');
    number.className = 'editor-phase-number';
    number.textContent = `Fase ${index + 1}`;
    const tools = doc.createElement('div');
    tools.className = 'editor-phase-tools';
    const disabled = {
      up: index === 0,
      down: index === draft.phases.length - 1,
      remove: !canRemovePhase(draft),
    };
    for (const { action, label } of PHASE_TOOLS) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'editor-tool-btn';
      button.dataset.action = action;
      button.dataset.index = String(index);
      button.textContent = label;
      button.disabled = disabled[action];
      tools.append(button);
    }
    head.append(number, tools);
    item.append(head);

    for (const { field, label, placeholder, mono, type, min } of PHASE_FIELDS) {
      const wrapper = doc.createElement('label');
      wrapper.className = 'editor-field';
      const caption = doc.createElement('span');
      caption.className = 'editor-label';
      caption.textContent = label;
      const input = doc.createElement('input');
      input.type = type ?? 'text';
      input.className = mono ? 'editor-input editor-input-math' : 'editor-input';
      input.autocomplete = 'off';
      input.spellcheck = !mono;
      input.placeholder = placeholder;
      if (min) input.min = min;
      input.value = phase[field];
      input.dataset.field = field;
      input.dataset.index = String(index);
      wrapper.append(caption, input);
      item.append(wrapper);
    }
    return item;
  }

  function render(focus) {
    nameInput.value = draft.name;
    list.replaceChildren(...draft.phases.map(phaseRow));
    addButton.disabled = !canAddPhase(draft);
    if (focus) {
      const target = list.querySelector(`[data-action="${focus.action}"][data-index="${focus.index}"]`);
      (target && !target.disabled ? target : addButton).focus();
    }
    showLink();
  }

  function replaceDraft(next, focus) {
    draft = next;
    persist();
    render(focus);
  }

  function editDraft(next) {
    draft = next;
    persist();
    showLink();
  }

  function takeLink(text) {
    const result = acceptPastedLink(draft, text);
    if (result.recognized) {
      replaceDraft(result.draft);
      showLink({ force: true });
      return;
    }
    showLink({ force: true });
    note.textContent = UNRECOGNIZED_NOTE;
  }

  nameInput.addEventListener('input', () => editDraft(setName(draft, nameInput.value)));

  list.addEventListener('input', (event) => {
    const { field, index } = event.target.dataset;
    if (!field) return;
    editDraft(setPhaseField(draft, Number(index), field, event.target.value));
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const index = Number(button.dataset.index);
    if (button.dataset.action === 'up') replaceDraft(movePhase(draft, index, -1), { action: 'up', index: index - 1 });
    if (button.dataset.action === 'down') replaceDraft(movePhase(draft, index, 1), { action: 'down', index: index + 1 });
    if (button.dataset.action === 'remove') {
      replaceDraft(removePhase(draft, index), { action: 'remove', index: Math.min(index, draft.phases.length - 2) });
    }
  });

  addButton.addEventListener('click', () => {
    replaceDraft(addPhase(draft));
    list.querySelector('.editor-phase:last-child input')?.focus();
  });

  linkInput.addEventListener('paste', (event) => {
    const text = event.clipboardData?.getData('text');
    if (typeof text !== 'string') return;
    event.preventDefault();
    takeLink(text);
  });

  linkInput.addEventListener('blur', () => {
    const current = classLinkState(draft, origin, pathname).value;
    const text = linkInput.value.trim();
    if (text === '' || text === current) {
      showLink({ force: true });
      return;
    }
    takeLink(text);
  });

  copyButton.addEventListener('click', () => {
    const value = linkInput.value;
    if (value === '') return;
    linkInput.focus();
    linkInput.select();
    Promise.resolve()
      .then(() => win.navigator.clipboard.writeText(value))
      .then(
      () => {
        copyButton.textContent = 'Copiado';
        win.setTimeout(() => {
          copyButton.textContent = 'Copiar';
        }, 1500);
      },
      () => {},
    );
  });

  persist();
  render();
}
