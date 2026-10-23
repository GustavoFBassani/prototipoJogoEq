import { winningConstant, formatSolution } from './algebra.js';

export function scoreForSteps(steps, minimum) {
  if (!Number.isInteger(minimum) || minimum < 1) return null;
  return Math.max(0, 100 - Math.max(0, steps - minimum) * 10);
}

export function checkWinCondition(game) {
  const constant = winningConstant(game.lhsItems, game.rhsItems);
  if (!constant) return;

  const completedBefore = game.completedLevels.size;
  game.completedLevels.add(game.currentLevelIndex);
  setTimeout(() => {
    triggerVictory(game, constant, completedBefore);
  }, 300);
}

export function triggerVictory(game, constTerm, completedBefore = Math.max(0, game.completedLevels.size - 1)) {
  game.sound.playLevelWin();

  const isFinalLevel = game.completedLevels.size >= game.levels.length;
  const winCard = document.querySelector('#win-modal .win-card');
  const finaleLabel = document.getElementById('win-finale-label');
  const progress = document.getElementById('win-progress');
  const progressFill = document.getElementById('win-progress-fill');
  const progressLabel = document.getElementById('win-progress-label');
  const level = game.levels[game.currentLevelIndex];
  const minimum = level.minSteps ?? game.minimumSteps;
  const score = scoreForSteps(game.steps, minimum);
  game.levelScores ??= new Map();
  game.levelScores.set(game.currentLevelIndex, score);

  const phaseCount = game.levels.length;
  const completedCount = Math.min(game.completedLevels.size, phaseCount);
  const phaseLabel = phaseCount === 1 ? 'fase' : 'fases';
  const completedText = phaseCount === 1
    ? '1 de 1 fase concluída'
    : `${completedCount} de ${phaseCount} ${phaseLabel} concluídas`;
  const progressPercent = phaseCount ? Math.round((completedCount / phaseCount) * 100) : 0;
  const previousPercent = phaseCount
    ? Math.round((Math.min(completedBefore, phaseCount) / phaseCount) * 100)
    : 0;
  progress.hidden = false;
  progress.setAttribute('aria-valuenow', String(progressPercent));
  progress.setAttribute('aria-valuetext', completedText);
  progressLabel.textContent = completedText;
  progressFill.style.width = `${previousPercent}%`;
  void progressFill.offsetWidth;
  progressFill.style.width = `${progressPercent}%`;

  if (isFinalLevel) {
    game.particles.createEndGameConfettiShower();
    winCard.classList.add('is-final');
    finaleLabel.hidden = false;
    document.querySelector('.win-trophy').textContent = '👑';
    const completionText = phaseCount === 1
      ? 'Você concluiu a fase'
      : `Você concluiu as ${completedCount} ${phaseLabel}`;
    document.querySelector('.win-title').textContent = completionText;
    document.getElementById('win-message').textContent = 'Sua jornada chegou ao fim. Parabéns!';
    document.getElementById('btn-next-level-label').textContent = 'Jogar de novo';
    const totalScore = [...game.levelScores.values()]
      .reduce((total, levelScore) => total + (levelScore ?? 0), 0);
    document.getElementById('win-total-score').textContent = `Pontuação total: ${totalScore} pontos`;
    document.getElementById('win-total-score').hidden = false;
  } else {
    game.particles.createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    winCard.classList.remove('is-final');
    finaleLabel.hidden = true;
    document.getElementById('win-total-score').hidden = true;
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Resolvida';
    document.getElementById('win-message').textContent = 'O x ficou sozinho.';
    document.getElementById('btn-next-level-label').textContent = 'Próxima';
  }

  const solution = formatSolution(constTerm);
  game.els.winScore.textContent = score === null
    ? `${game.steps} passos utilizados · mínimo otimizado não definido`
    : `${game.steps} passos · mínimo ${minimum} · ${score} pontos`;
  game.els.winSolText.textContent = solution;
  game.tutor?.celebrate(solution);
  game.els.winModal.inert = false;
  game.els.winModal.classList.add('active');
}
