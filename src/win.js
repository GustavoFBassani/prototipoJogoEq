import { countTokens, isIsolatedX } from './algebra.js';

export function checkWinCondition(game) {
  const left = countTokens(game.lhsItems);
  const right = countTokens(game.rhsItems);

  const leftIsolated = isIsolatedX(left, right);
  const rightIsolated = isIsolatedX(right, left);

  if (leftIsolated || rightIsolated) {
    const finalVal = leftIsolated ? right.pos1 - right.neg1 : left.pos1 - left.neg1;
    game.completedLevels.add(game.currentLevelIndex);
    setTimeout(() => {
      triggerVictory(game, finalVal);
    }, 300);
  }
}

export function triggerVictory(game, value) {
  game.sound.playLevelWin();

  const isFinalLevel = game.completedLevels.size >= game.levels.length;

  if (isFinalLevel) {
    game.particles.createEndGameConfettiShower();
    document.querySelector('.win-trophy').textContent = '👑';
    document.querySelector('.win-title').textContent = 'Todas as fases';
    document.getElementById('win-message').textContent = 'O x ficou sozinho em todas.';
    document.getElementById('btn-next-level').textContent = 'De novo';
  } else {
    game.particles.createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Resolvida';
    document.getElementById('win-message').textContent = 'O x ficou sozinho.';
    document.getElementById('btn-next-level').textContent = 'Próxima';
  }

  game.els.winSolText.textContent = `x = ${value}`;
  game.els.winModal.classList.add('active');
}
