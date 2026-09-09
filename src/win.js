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
    document.querySelector('.win-title').textContent = 'Mestre da Álgebra!';
    document.getElementById('win-message').textContent =
      'Parabéns! Você concluiu todos os 11 níveis do EquaLab e dominou o equilíbrio algébrico!';
    document.getElementById('btn-next-level').textContent = '🎮 Jogar Novamente';
  } else {
    game.particles.createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Equação Resolvida!';
    document.getElementById('win-message').textContent =
      'Excelente trabalho! Você isolou o x mantendo o equilíbrio perfeito em ambos os lados.';
    document.getElementById('btn-next-level').textContent = 'Próxima Fase ➔';
  }

  game.els.winSolText.textContent = `x = ${value}`;
  game.els.winModal.classList.add('active');
}
