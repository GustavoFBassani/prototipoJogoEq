const VERSION = 1;
const TERM_KINDS = new Set(['variable', 'constant']);

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(payload) {
  if (typeof payload !== 'string' || !/^[A-Za-z0-9_-]*$/.test(payload)) return null;
  if (payload.length % 4 === 1) return null;
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function parsePayload(payload) {
  const text = fromBase64Url(payload);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

function isTerm(term) {
  return isObject(term) && TERM_KINDS.has(term.kind) && isFiniteNumber(term.num) && isFiniteNumber(term.den);
}

function isEnvelope(value) {
  return isObject(value) && value.v === VERSION && typeof value.name === 'string' && Array.isArray(value.phases);
}

function isStudentPhase(phase) {
  return (
    isObject(phase) &&
    typeof phase.title === 'string' &&
    typeof phase.hint === 'string' &&
    (phase.minSteps === undefined || (Number.isInteger(phase.minSteps) && phase.minSteps > 0)) &&
    Array.isArray(phase.lhs) &&
    Array.isArray(phase.rhs) &&
    phase.lhs.every(isTerm) &&
    phase.rhs.every(isTerm)
  );
}

function isDraftPhase(phase) {
  return (
    isObject(phase) &&
    typeof phase.title === 'string' &&
    typeof phase.hint === 'string' &&
    typeof phase.equation === 'string'
  );
}

export function encodeStudentActivity(activity) {
  return toBase64Url(JSON.stringify(activity));
}

export function encodeEditorDraft(draft) {
  return toBase64Url(JSON.stringify(draft));
}

export function decodeStudentActivity(payload) {
  const value = parsePayload(payload);
  if (!isEnvelope(value) || !value.phases.every(isStudentPhase)) return null;
  return value;
}

export function decodeEditorDraft(payload) {
  const value = parsePayload(payload);
  if (!isEnvelope(value) || !value.phases.every(isDraftPhase)) return null;
  return value;
}

export function readSearch(search) {
  const params = new URLSearchParams(search ?? '');
  if (params.has('editar')) {
    const d = params.get('d');
    return { mode: 'editor', draft: d === null ? null : decodeEditorDraft(d) };
  }
  const a = params.get('a');
  const activity = a === null ? null : decodeStudentActivity(a);
  return activity ? { mode: 'play', activity } : { mode: 'campaign' };
}

export function buildStudentUrl(origin, pathname, activity) {
  return `${origin}${pathname}?a=${encodeStudentActivity(activity)}`;
}

export function buildEditorUrl(origin, pathname, draft) {
  return `${origin}${pathname}?editar&d=${encodeEditorDraft(draft)}`;
}
