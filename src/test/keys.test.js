import { describe, it, expect } from 'vitest';
import { Operation, Operand, operationFromKey, operationWithOperand, isTypingTarget } from '../keys.js';

describe('operationFromKey', () => {
  it('maps 1-4 to add, subtract, multiply, divide', () => {
    expect(operationFromKey('1')).toBe(Operation.ADD);
    expect(operationFromKey('2')).toBe(Operation.SUBTRACT);
    expect(operationFromKey('3')).toBe(Operation.MULTIPLY);
    expect(operationFromKey('4')).toBe(Operation.DIVIDE);
  });

  it('maps + - * / to the same operations', () => {
    expect(operationFromKey('+')).toBe(Operation.ADD);
    expect(operationFromKey('-')).toBe(Operation.SUBTRACT);
    expect(operationFromKey('*')).toBe(Operation.MULTIPLY);
    expect(operationFromKey('/')).toBe(Operation.DIVIDE);
  });

  it('returns null for keys that are not ops', () => {
    expect(operationFromKey('Enter')).toBeNull();
    expect(operationFromKey('Escape')).toBeNull();
    expect(operationFromKey('x')).toBeNull();
    expect(operationFromKey('7')).toBeNull();
    expect(operationFromKey('5')).toBeNull();
    expect(operationFromKey('6')).toBeNull();
  });
});

describe('operationWithOperand', () => {
  it('keeps the operation and attaches the operand', () => {
    expect(operationWithOperand(Operation.ADD, Operand.UNKNOWN)).toEqual({
      operation: Operation.ADD,
      operand: Operand.UNKNOWN,
    });
    expect(operationWithOperand(Operation.SUBTRACT, Operand.NUMBER)).toEqual({
      operation: Operation.SUBTRACT,
      operand: Operand.NUMBER,
    });
    expect(operationWithOperand(Operation.MULTIPLY, Operand.NUMBER)).toEqual({
      operation: Operation.MULTIPLY,
      operand: Operand.NUMBER,
    });
  });
});

describe('isTypingTarget', () => {
  it('is true for input, textarea, and contenteditable', () => {
    expect(isTypingTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('is false for buttons and empty targets', () => {
    expect(isTypingTarget({ tagName: 'BUTTON', isContentEditable: false })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
