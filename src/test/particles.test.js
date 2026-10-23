import { describe, it, expect, vi } from 'vitest';
import { initParticles } from '../particles.js';

function createParticles(overrides = {}) {
  const fire = vi.fn();
  const particles = initParticles({
    fire,
    getSize: () => ({ width: 200, height: 100 }),
    ...overrides,
  });
  return { fire, particles };
}

describe('initParticles', () => {
  it('maps a dust explosion to a circular two-color burst', () => {
    const { fire, particles } = createParticles();
    particles.createDustExplosion(50, 25, '#aaa', '#bbb');

    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 35,
        shapes: ['circle'],
        colors: ['#aaa', '#bbb'],
        origin: { x: 0.25, y: 0.25 },
      })
    );
  });

  it('maps a confetti burst to the palette at the given point', () => {
    const { fire, particles } = createParticles();
    particles.createConfettiBurst(100, 50);

    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 90,
        colors: ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#ffffff'],
        origin: { x: 0.5, y: 0.5 },
      })
    );
  });

  it('celebrates the final win with side fountains and stops the shower after 26 bursts', () => {
    const timers = [];
    const clearInterval = vi.fn();
    const { fire, particles } = createParticles({
      random: () => 0.2,
      setInterval: (cb) => {
        timers.push(cb);
        return 9;
      },
      clearInterval,
    });

    particles.createEndGameConfettiShower();
    for (let i = 0; i < 26; i += 1) timers[0]();

    expect(fire).toHaveBeenCalledTimes(28);
    expect(fire.mock.calls[0][0]).toMatchObject({
      particleCount: 70,
      angle: 60,
      origin: { x: 0.08, y: 0.78 },
    });
    expect(fire.mock.calls[1][0]).toMatchObject({
      particleCount: 70,
      angle: 120,
      origin: { x: 0.92, y: 0.78 },
    });
    expect(fire.mock.calls[2][0].particleCount).toBe(50);
    expect(fire.mock.calls[2][0].origin.x).toBe(0.2);
    expect(fire.mock.calls[2][0].origin.y).toBeCloseTo(0.14);
    expect(clearInterval).toHaveBeenCalledWith(9);
  });
});
