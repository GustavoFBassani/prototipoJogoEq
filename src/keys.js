export const Operation = Object.freeze({
  ADD: 'add',
  SUBTRACT: 'subtract',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
});

export const Operand = Object.freeze({
  NUMBER: 'number',
  UNKNOWN: 'unknown',
});

export const OPERATION_KEYS = [
  { key: '1', operation: Operation.ADD },
  { key: '+', operation: Operation.ADD },
  { key: '2', operation: Operation.SUBTRACT },
  { key: '-', operation: Operation.SUBTRACT },
  { key: '3', operation: Operation.MULTIPLY },
  { key: '*', operation: Operation.MULTIPLY },
  { key: '4', operation: Operation.DIVIDE },
  { key: '/', operation: Operation.DIVIDE },
];

export function operationFromKey(key) {
  return OPERATION_KEYS.find((row) => row.key === key)?.operation ?? null;
}

export function operationWithOperand(operation, operand) {
  return { operation, operand };
}

export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}
