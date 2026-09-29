import { describe, it, expect, vi } from 'vitest';
import { LEVELS } from '../levels.js';
import { cornerPosition, createTutor, plainHint, roverSpot, TUTORIAL_STEPS } from '../tutor.js';

function fakeAgent(anims = ['Greet', 'GestureLeft', 'Thinking', 'GetAttention', 'Acknowledge', 'Congratulate']) {
  const calls = [];
  return {
    calls,
    _el: { style: {} },
    _animator: {
      _data: { framesize: [80, 80] },
      _sounds: { bark: { muted: false } },
    },
    _balloon: {
      hide: vi.fn(),
      _hiding: 42,
      _balloon: { style: {} },
      _content: { style: {} },
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
  it('explains the balance, the buttons, merging, the goal, and the hint button', () => {
    const script = TUTORIAL_STEPS.map((step) => step.text).join(' ');
    expect(script).toMatch(/balança/i);
    expect(script).toMatch(/dois lados/);
    expect(script).toMatch(/fundem/);
    expect(script).toMatch(/x fica sozinho/);
    expect(script).toMatch(/Dica/);
  });
});

describe('createTutor', () => {
  it('places Rover and plays the tutorial in order', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.place(1280, 800, { right: 900, top: 200, height: 240 });
    tutor.start();

    expect(agent._el.style.left).toBe('908px');
    expect(agent._el.style.top).toBe('280px');
    expect(agent._balloon._content.style.fontFamily).toBe('Minecraft, monospace');

    const spoken = agent.calls.filter((call) => call[0] === 'speak').map((call) => call[1]);
    expect(spoken).toEqual(TUTORIAL_STEPS.map((step) => step.text));
    const greetAt = agent.calls.findIndex((call) => call[0] === 'play' && call[1] === 'Greet');
    expect(greetAt).toBeGreaterThan(agent.calls.findIndex((call) => call[0] === 'speak'));
  });

  it('interrupts and reads the hint without tags', () => {
    const agent = fakeAgent();
    const tutor = createTutor(agent);
    tutor.speakHint(LEVELS[0].hint);

    expect(agent.calls[0]).toEqual(['stop']);
    expect(agent._balloon.hide).toHaveBeenCalledWith(true);
    expect(agent._balloon._hiding).toBe(null);
    const spoken = agent.calls.find((call) => call[0] === 'speak');
    expect(spoken[1]).toBe('Aplique − com 2 aos dois lados, ou arraste iguais no mesmo prato para fundir.');
    expect(spoken[2]).toEqual({ hold: true });
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

  it('reads a hint even when Rover has no extra animations', () => {
    const agent = fakeAgent([]);
    const tutor = createTutor(agent);
    tutor.speakHint('Só o x.');
    expect(agent.calls.some((call) => call[0] === 'play')).toBe(false);
    expect(agent.calls).toContainEqual(['speak', 'Só o x.', { hold: true }]);
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
