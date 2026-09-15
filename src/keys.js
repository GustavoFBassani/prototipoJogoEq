export const OP_KEYS = [
  { key: '1', op: '+N' },
  { key: '2', op: '-N' },
  { key: '3', op: '+Nx' },
  { key: '4', op: '-Nx' },
  { key: '5', op: '*N' },
  { key: '6', op: '/N' },
];

export function opFromKey(key) {
  return OP_KEYS.find((row) => row.key === key)?.op ?? null;
}

export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}
