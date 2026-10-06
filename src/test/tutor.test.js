import { describe, it, expect, vi } from 'vitest';
import { LEVELS } from '../levels.js';
import { cornerPosition, createTutor, plainHint, roverSpot, TUTORIAL_STEPS } from '../tutor.js';

function fakeAgent(anims = ['Greet', 'GestureLeft', 'Thinking', 'GetAttention', 'Acknowledge', 'Congratulate']) {
  const calls = [];
  const listeners = new Map();
  return {
    calls,
    _el: {
      style: {},
      offsetWidth: 80,
      offsetHeight: 80,
      addEventListener: vi.fn((type, listener) => listeners.set(type, listener)),
      getBoundingClientRect: () => ({ left: 30, top: 40 }),
      setPointerCapture: vi.fn(),
      listeners,
    },
    _animator: {
      _data: { framesize: [80, 80] },
      _sounds: { bark: { muted: false } },
    },
    _balloon: {
      hide: vi.fn(),
      _hiding: 42,
      _balloon: { style: {} },
      _content: { style: {} },
      show: vi.fn(),
    },
    hasAnimation(name) {
      return anims.includes(name);
    },
    play(name, timeout) {
      calls.push(['play', name, timeout]);
      return true;
    },
    speak(text, opts) {
      calls.push(['speak', text, opts]);
    },
    stop() {
      calls.push(['stop']);
    },
    show(fast) {
      calls.push(['show', fast]);
    },
    reposition() {
      calls.push(['reposition']);
    },
    pause() {
      calls.push(['pause']);
    },
    resume() {
      calls.push(['resume']);
    },
  };
}

describe('plainHint', () => {
  it('strips markup from every level hint', () => {
    for (const lvl of LEVELS) {
      const text = plainHint(lvl.hint);
      expect(text).not.toMatch(/[<>]/);
      expect(text.length).toBeGreaterThan(10);
    }
  });

  it('decodes the entities the hints use', () => {
    expect(plainHint('Aplique <b>−</b> com 2')).toBe('Aplique − com 2');
    expect(plainHint('1 &lt; x &amp; 2&nbsp;y')).toBe('1 < x & 2 y');
  });
});

describe('roverSpot', () => {
  it('sits beside the scale when there is room', () => {
    expect(roverSpot(
      { width: 1280, height: 800 },
      { right: 900, top: 200, height: 240 },
      80,
      16,
    )).toEqual({ x: 908, y: 280 });
  });

  it('falls back to the corner on a narrow screen', () => {
    expect(roverSpot(
      { width: 400, height: 700 },
      { right: 360, top: 100, height: 200 },
      80,
      16,
    )).toEqual(cornerPosition(400, 700, 80, 16));
  });
});

describe('TUTORIAL_STEPS', () => {
  it('has a slide and visible target for each game instruction', () => {
    const script = TUTORIAL_STEPS.map((step) => step.text).join(' ');
    expect(script).toMatch(/dois lados/);
    expect(script).toMatch(/x fique sozinho/);
    expect(script).toMatch(/Dica/);
    expect(TUTORIAL_STEPS.every((step) => step.target.startsWith('.') || step.target.startsWith('#'))).toBe(true);
    expect(TUTORIAL_STEPS.some((step) => step.target === '#step-count')).toBe(true);
  });
});

describe('createTutor', () => {
  it('supports dragging Rover with pointer input and clamps him to the viewport', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    const pointerDown = agent._el.listeners.get('pointerdown');
    const pointerMove = agent._el.listeners.get('pointermove');
    const pointerUp = agent._el.listeners.get('pointerup');
    const preventDefault = vi.fn();
    vi.stubGlobal('window', { innerWidth: 320, innerHeight: 240 });

    pointerDown({
      button: 0,
      pointerId: 7,
      pointerType: 'touch',
      clientX: 40,
      clientY: 50,
      preventDefault,
    });
    pointerMove({ pointerId: 7, clientX: 300, clientY: 220, preventDefault });
    pointerUp({ pointerId: 7 });

    expect(agent._el.style.touchAction).toBe('none');
    expect(agent._el.style.left).toBe('235px');
    expect(agent._el.style.top).toBe('155px');
    expect(agent.calls).toContainEqual(['pause']);
    expect(agent.calls).toContainEqual(['resume']);
    expect(agent._balloon.show).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it('places Rover without speaking during the visual tutorial', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.place(1280, 800, { right: 900, top: 200, height: 240 });

    expect(agent._balloon.WORD_SPEAK_TIME).toBe(350);
    expect(agent._balloon.CLOSE_BALLOON_DELAY).toBe(6000);
    expect(agent._el.style.left).toBe('908px');
    expect(agent._el.style.top).toBe('280px');
    expect(agent._balloon._content.style.fontFamily).toBe('Minecraft, monospace');
    expect(agent.calls.some((call) => call[0] === 'speak')).toBe(false);
    expect(agent.calls.some((call) => call[0] === 'play')).toBe(false);
  });

  it('speaks the readable hint when the student asks for help', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.speakHint('<b>Some</b> 2 nos dois lados.');

    expect(agent.calls[0]).toEqual(['stop']);
    expect(agent._balloon.hide).toHaveBeenCalledWith(true);
    expect(agent._balloon._hiding).toBe(null);
    expect(agent.calls.find((call) => call[0] === 'speak')).toEqual([
      'speak',
      'Dica: Some 2 nos dois lados.',
      undefined,
    ]);
  });

  it('congratulates with the solution', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.celebrate('x = 3');
    const speakAt = agent.calls.findIndex((call) => call[0] === 'speak');
    const playAt = agent.calls.findIndex((call) => call[0] === 'play');
    expect(agent.calls[speakAt]).toEqual(['speak', 'Boa! x = 3', undefined]);
    expect(speakAt).toBeLessThan(playAt);
    expect(agent.calls[playAt]).toEqual(['play', 'Congratulate', 1800]);
  });

  it('can speak a hint when Rover has no extra animations', () => {
    const agent = fakeAgent([]);
    const tutor = createTutor(agent);
    tutor.speakHint('Só o x.');
    expect(agent.calls.some((call) => call[0] === 'play')).toBe(false);
    expect(agent.calls.some((call) => call[0] === 'speak' && call[1] === 'Dica: Só o x.')).toBe(true);
  });

  it('explains how to solve a free equation without reading the phase hint', () => {
    const agent = fakeAgent([]);
    const tutor = createTutor(agent);
    tutor.explainCustomEquation();
    expect(agent.calls.some((call) => call[0] === 'speak' && /equação livre/.test(call[1]))).toBe(true);
  });

  it('mutes Rover when the game sound is off', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.setSoundEnabled(false);
    expect(agent._animator._sounds.bark.muted).toBe(true);
    tutor.setSoundEnabled(true);
    expect(agent._animator._sounds.bark.muted).toBe(false);
  });
});
