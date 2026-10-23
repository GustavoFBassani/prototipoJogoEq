import { afterEach, describe, expect, it, vi } from 'vitest';
import { triggerVictory } from '../win.js';

function setupVictory({ completedLevels = [0, 1], cardClasses = [], levelScores = [[0, 70]] } = {}) {
  const classes = new Set(cardClasses);
  const elements = {
    '.win-trophy': { textContent: '🏆' },
    '.win-title': { textContent: 'Resolvida' },
    '#win-modal .win-card': {
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
      },
    },
    '#win-finale-label': { hidden: true },
    '#win-message': { textContent: '' },
    '#btn-next-level-label': { textContent: '' },
    '#win-progress': {
      hidden: true,
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
    },
    '#win-progress-fill': { style: {}, offsetWidth: 340 },
    '#win-progress-label': { textContent: '' },
    '#win-total-score': { hidden: true, textContent: '' },
  };
  const modalClasses = new Set();
  const game = {
    sound: { playLevelWin: vi.fn() },
    completedLevels: new Set(completedLevels),
    levels: [{ minSteps: 1 }, { minSteps: 1 }],
    levelScores: new Map(levelScores),
    currentLevelIndex: completedLevels.length - 1,
    steps: 1,
    els: {
      winModal: {
        inert: true,
        classList: {
          add: (name) => modalClasses.add(name),
          contains: (name) => modalClasses.has(name),
        },
      },
      winScore: { textContent: '' },
      winSolText: { textContent: '' },
    },
    particles: {
      createEndGameConfettiShower: vi.fn(),
      createConfettiBurst: vi.fn(),
    },
    tutor: { celebrate: vi.fn() },
  };

  vi.stubGlobal('document', {
    querySelector: (selector) => elements[selector],
    getElementById: (id) => elements[`#${id}`],
  });
  vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768 });

  return { elements, game, classes };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('triggerVictory', () => {
  it('highlights completion and keeps restarting available after the final level', () => {
    const { elements, game, classes } = setupVictory();

    triggerVictory(game, { kind: 'constant', num: 3, den: 1 });

    expect(classes.has('is-final')).toBe(true);
    expect(elements['#win-finale-label'].hidden).toBe(false);
    expect(elements['.win-title'].textContent).toBe('Você concluiu as 2 fases');
    expect(elements['#win-message'].textContent).toBe('Sua jornada chegou ao fim. Parabéns!');
    expect(elements['#win-progress'].hidden).toBe(false);
    expect(elements['#win-progress'].attributes['aria-valuenow']).toBe('100');
    expect(elements['#win-progress'].attributes['aria-valuetext']).toBe('2 de 2 fases concluídas');
    expect(elements['#win-progress-fill'].style.width).toBe('100%');
    expect(elements['#win-progress-label'].textContent).toBe('2 de 2 fases concluídas');
    expect(elements['#win-total-score'].textContent).toBe('Pontuação total: 170 pontos');
    expect(elements['#win-total-score'].hidden).toBe(false);
    expect(elements['#btn-next-level-label'].textContent).toBe('Jogar de novo');
    expect(game.particles.createEndGameConfettiShower).toHaveBeenCalledOnce();
  });

  it('restores the regular win screen for non-final levels', () => {
    const { elements, game, classes } = setupVictory({
      completedLevels: [0],
      cardClasses: ['is-final'],
    });

    triggerVictory(game, { kind: 'constant', num: 3, den: 1 });

    expect(classes.has('is-final')).toBe(false);
    expect(elements['#win-finale-label'].hidden).toBe(true);
    expect(elements['#win-progress'].hidden).toBe(false);
    expect(elements['#win-progress'].attributes['aria-valuenow']).toBe('50');
    expect(elements['#win-progress'].attributes['aria-valuetext']).toBe('1 de 2 fases concluídas');
    expect(elements['#win-progress-fill'].style.width).toBe('50%');
    expect(elements['#win-progress-label'].textContent).toBe('1 de 2 fases concluídas');
    expect(elements['#win-total-score'].hidden).toBe(true);
    expect(elements['#win-message'].textContent).toBe('O x ficou sozinho.');
    expect(elements['#btn-next-level-label'].textContent).toBe('Próxima');
    expect(game.particles.createConfettiBurst).toHaveBeenCalledOnce();
  });
});
