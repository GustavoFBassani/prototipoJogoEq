import confetti from 'canvas-confetti';

const CONFETTI_COLORS = ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#ffffff'];

function originFromPoint(x, y, getSize) {
  const { width, height } = getSize();
  return {
    x: width ? x / width : 0.5,
    y: height ? y / height : 0.5,
  };
}

export function initParticles(options = {}) {
  const getSize =
    options.getSize ||
    (() => ({
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
    }));
  const random = options.random || Math.random;
  const setIntervalFn = options.setInterval || globalThis.setInterval.bind(globalThis);
  const clearIntervalFn = options.clearInterval || globalThis.clearInterval.bind(globalThis);

  const fire =
    options.fire ||
    (() => {
      const canvas = options.canvas || document.getElementById('particle-canvas');
      if (!canvas) {
        throw new Error('Particle canvas is not available');
      }
      return confetti.create(canvas, { resize: true });
    })();

  return {
    createDustExplosion(x, y, colorA = '#4ade80', colorB = '#c084fc') {
      fire({
        particleCount: 35,
        spread: 360,
        startVelocity: 28,
        gravity: 0.9,
        ticks: 80,
        scalar: 0.75,
        origin: originFromPoint(x, y, getSize),
        colors: [colorA, colorB],
        shapes: ['circle'],
      });
    },

    createConfettiBurst(x, y) {
      fire({
        particleCount: 90,
        spread: 100,
        startVelocity: 45,
        origin: originFromPoint(x, y, getSize),
        colors: CONFETTI_COLORS,
      });
    },

    createEndGameConfettiShower() {
      let count = 0;
      const interval = setIntervalFn(() => {
        fire({
          particleCount: 50,
          spread: 120,
          startVelocity: 55,
          origin: {
            x: random(),
            y: random() * 0.7,
          },
          colors: CONFETTI_COLORS,
        });
        count += 1;
        if (count > 25) clearIntervalFn(interval);
      }, 120);
    },
  };
}
