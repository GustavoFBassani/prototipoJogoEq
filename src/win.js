import { winningConstant, formatSolution } from './algebra.js';

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
    document.querySelector('.win-title').textContent = 'Todas as fases';
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
  game.els.winSolText.textContent = solution;
  game.tutor?.celebrate(solution);
  game.els.winModal.inert = false;
  game.els.winModal.classList.add('active');
}
