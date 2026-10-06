import { TUTORIAL_STEPS } from './game.js';

export { TUTORIAL_STEPS };

export function plainHint(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cornerPosition(viewportWidth, viewportHeight, frame = 80, margin = 16) {
  return {
    x: Math.max(margin, viewportWidth - frame - margin),
    y: Math.max(margin, viewportHeight - frame - margin),
  };
}

export function roverSpot(viewport, board, frame = 80, margin = 16) {
  const corner = cornerPosition(viewport.width, viewport.height, frame, margin);
  if (!board) return corner;

  const besideX = board.right + 8;
  if (besideX + frame + margin > viewport.width) return corner;

  const y = board.top + Math.max(0, (board.height - frame) / 2);
  return {
    x: besideX,
    y: Math.max(margin, Math.min(y, viewport.height - frame - margin)),
  };
}

function playIf(agent, name, timeout = 2200) {
  if (name && agent.hasAnimation(name)) agent.play(name, timeout);
}

function interrupt(agent) {
  agent.stop();
  const balloon = agent._balloon;
  if (!balloon) return;
  balloon.hide(true);
  if (balloon._hiding) {
    clearTimeout(balloon._hiding);
    balloon._hiding = null;
  }
}

function enablePointerDrag(agent) {
  const element = agent._el;
  if (!element?.addEventListener) return;

  element.style.touchAction = 'none';
  let activePointer = null;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    activePointer = event.pointerId;
    const bounds = element.getBoundingClientRect();
    offsetX = event.clientX - bounds.left;
    offsetY = event.clientY - bounds.top;
    element.setPointerCapture?.(activePointer);
    agent.pause();
    agent._balloon?.hide(true);
  });

  element.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    const margin = 5;
    const maxX = Math.max(margin, window.innerWidth - element.offsetWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - element.offsetHeight - margin);
    const x = Math.max(margin, Math.min(event.clientX - offsetX, maxX));
    const y = Math.max(margin, Math.min(event.clientY - offsetY, maxY));
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });

  const finishDrag = (event) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    agent._balloon?.show();
    agent.reposition();
    agent.resume();
  };

  element.addEventListener('pointerup', finishDrag);
  element.addEventListener('pointercancel', finishDrag);
  element.addEventListener('lostpointercapture', finishDrag);
}

export function createTutor(agent) {
  enablePointerDrag(agent);
  if (agent._balloon) {
    agent._balloon.WORD_SPEAK_TIME = 350;
    agent._balloon.CLOSE_BALLOON_DELAY = 6000;
  }

  return {
    place(viewportWidth, viewportHeight, board) {
      const frame = agent._animator?._data?.framesize?.[0] ?? 80;
      const { x, y } = roverSpot(
        { width: viewportWidth, height: viewportHeight },
        board,
        frame,
      );
      agent._el.style.left = `${x}px`;
      agent._el.style.top = `${y}px`;
      agent.show(true);
      agent.reposition();

      const balloon = agent._balloon?._balloon;
      const content = agent._balloon?._content;
      if (balloon && content) {
        balloon.style.maxWidth = '280px';
        content.style.maxWidth = '260px';
        content.style.fontFamily = 'Minecraft, monospace';
        content.style.fontSize = '15px';
        content.style.lineHeight = '1.35';
      }
    },
    speakHint(html) {
      interrupt(agent);
      const hint = plainHint(html);
      if (hint) agent.speak(`Dica: ${hint}`);
    },
    explainCustomEquation() {
      interrupt(agent);
      agent.speak(
        'Na equação livre, aplique a mesma operação nos dois lados. Arraste termos iguais para juntar ou cancelar, até deixar o x sozinho.',
      );
    },
    celebrate(solution) {
      interrupt(agent);
      agent.speak(solution ? `Boa! ${solution}` : 'Boa! O x ficou sozinho.');
      playIf(agent, 'Congratulate', 1800);
    },
    hush() {
      interrupt(agent);
    },
    setSoundEnabled(enabled) {
      const sounds = agent._animator?._sounds;
      if (!sounds) return;
      for (const audio of Object.values(sounds)) {
        audio.muted = !enabled;
      }
    },
  };
}

export async function attachTutor(game) {
  let pendingHint = null;
  let pendingWin = null;
  let pendingCustomExplanation = false;
  game.tutor = {
    speakHint(html) {
      pendingHint = html;
    },
    celebrate(solution) {
      pendingWin = solution;
    },
    explainCustomEquation() {
      pendingCustomExplanation = true;
    },
    hush() {
      pendingHint = null;
      pendingWin = null;
    },
    setSoundEnabled() {},
  };

  const { initAgent } = await import('clippyjs');
  const { default: Rover } = await import('clippyjs/agents/rover');
  const agent = await initAgent(Rover);
  const tutor = createTutor(agent);
  game.tutor = tutor;
  tutor.setSoundEnabled(game.sound.enabled);
  const board = document.querySelector('.containers-grid')?.getBoundingClientRect();
  tutor.place(window.innerWidth, window.innerHeight, board);

  if (game.hintOpen && pendingHint) {
    tutor.speakHint(pendingHint);
    return;
  }
  if (pendingWin) {
    tutor.celebrate(pendingWin);
    return;
  }
  if (pendingCustomExplanation) {
    tutor.explainCustomEquation();
  }
}
