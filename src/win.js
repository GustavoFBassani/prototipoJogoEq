import { winningConstant, formatSolution } from './algebra.js';

export function scoreForSteps(steps, minimum) {
  if (!Number.isInteger(minimum) || minimum < 1) return null;
  return Math.max(0, 100 - Math.max(0, steps - minimum) * 10);
}

export function checkWinCondition(game) {
  const constant = winningConstant(game.lhsItems, game.rhsItems);
  if (!constant) return;

  game.completedLevels.add(game.currentLevelIndex);
  setTimeout(() => {
    triggerVictory(game, constant);
  }, 300);
}

export function triggerVictory(game, constTerm) {
  game.sound.playLevelWin();

  const isFinalLevel = game.completedLevels.size >= game.levels.length;

  if (isFinalLevel) {
    game.particles.createEndGameConfettiShower();
    document.querySelector('.win-trophy').textContent = '👑';
    document.querySelector('.win-title').textContent =
      game.activity && game.activityName ? game.activityName : 'Todas as fases';
    document.getElementById('win-message').textContent = 'O x ficou sozinho em todas.';
    document.getElementById('btn-next-level-label').textContent = 'De novo';
  } else {
    game.particles.createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Resolvida';
    document.getElementById('win-message').textContent = 'O x ficou sozinho.';
    document.getElementById('btn-next-level-label').textContent = 'Próxima';
  }

  const solution = formatSolution(constTerm);
  const level = game.levels[game.currentLevelIndex];
  const minimum = level.minSteps ?? game.minimumSteps;
  const score = scoreForSteps(game.steps, minimum);
  game.els.winScore.textContent = score === null
    ? `${game.steps} passos utilizados · mínimo otimizado não definido`
    : `${game.steps} passos · mínimo ${minimum} · ${score} pontos`;
  game.els.winSolText.textContent = solution;
  game.tutor?.celebrate(solution);
  game.els.winModal.inert = false;
  game.els.winModal.classList.add('active');
}
