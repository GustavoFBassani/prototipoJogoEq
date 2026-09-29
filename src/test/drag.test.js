import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupDrag } from '../drag.js';

describe('setupDrag', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('updates transform on pointermove during drag and resets on end', () => {
    const windowListeners = new Map();
    global.window = {
      addEventListener: vi.fn((event, handler) => {
        windowListeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event) => {
        windowListeners.delete(event);
      }),
    };

    const elementListeners = new Map();
    const classList = new Set();
    const style = { transform: '', zIndex: '' };
    const container = { style: { zIndex: '' } };

    const element = {
      addEventListener: vi.fn((event, handler) => {
        elementListeners.set(event, handler);
      }),
      classList: {
        add: vi.fn((cls) => classList.add(cls)),
        remove: vi.fn((cls) => classList.delete(cls)),
        contains: (cls) => classList.has(cls),
      },
      style,
      closest: vi.fn(() => container),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };

    const mockGame = {
      lhsItems: [{ id: 1, kind: 'constant', num: 1, den: 1 }],
      rhsItems: [],
      els: {
        dropzoneLhs: {
          classList: { add: vi.fn(), remove: vi.fn() },
          querySelectorAll: vi.fn(() => []),
        },
        dropzoneRhs: {
          classList: { add: vi.fn(), remove: vi.fn() },
          querySelectorAll: vi.fn(() => []),
        },
      },
      particles: {
        createDustExplosion: vi.fn(),
      },
      sound: {
        playDustAnnihilation: vi.fn(),
        playAddOperation: vi.fn(),
      },
      renderAll: vi.fn(),
    };

    setupDrag(element, mockGame.lhsItems[0], 'lhs', mockGame);

    // Trigger pointerdown
    const pointerDownHandler = elementListeners.get('pointerdown');
    expect(pointerDownHandler).toBeDefined();

    pointerDownHandler({
      button: 0,
      pointerType: 'mouse',
      pointerId: 42,
      clientX: 100,
      clientY: 100,
      preventDefault: vi.fn(),
    });

    expect(classList.has('dragging')).toBe(true);
    expect(style.transform).toBe('translate3d(0px, 0px, 0) scale(1.15)');
    expect(container.style.zIndex).toBe('50');

    // Trigger pointermove on window
    const pointerMoveHandler = windowListeners.get('pointermove');
    expect(pointerMoveHandler).toBeDefined();

    pointerMoveHandler({
      clientX: 150,
      clientY: 130,
    });

    expect(style.transform).toBe('translate3d(50px, 30px, 0) scale(1.15)');

    // Trigger pointerup on window
    const pointerUpHandler = windowListeners.get('pointerup');
    expect(pointerUpHandler).toBeDefined();

    pointerUpHandler();

    expect(classList.has('dragging')).toBe(false);
    expect(style.transform).toBe('');
    expect(container.style.zIndex).toBe('');
    expect(windowListeners.has('pointermove')).toBe(false);
  });
});
