import { describe, it, expect } from 'vitest';
import { opFromKey, isTypingTarget } from './keys.js';

describe('opFromKey', () => {
  it('maps 1-6 to the six operations in button order', () => {
    expect(opFromKey('1')).toBe('+1');
    expect(opFromKey('2')).toBe('-1');
    expect(opFromKey('3')).toBe('+x');
    expect(opFromKey('4')).toBe('-x');
    expect(opFromKey('5')).toBe('*N');
    expect(opFromKey('6')).toBe('/N');
  });

  it('returns null for keys that are not ops', () => {
    expect(opFromKey('Enter')).toBeNull();
    expect(opFromKey('Escape')).toBeNull();
    expect(opFromKey('x')).toBeNull();
    expect(opFromKey('7')).toBeNull();
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
