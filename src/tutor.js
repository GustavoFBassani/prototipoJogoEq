export const TUTORIAL_STEPS = [
  { animation: 'Greet', text: 'Oi! Sou o Rover. Vou te mostrar como jogar.' },
  { animation: 'GestureLeft', text: 'A equação é uma balança. O lado azul vale o mesmo que o roxo.' },
  { animation: 'GestureLeft', text: 'Os botões aplicam a mesma conta nos dois lados.' },
  { animation: 'GestureLeft', text: 'Arraste peças iguais no mesmo prato. Elas se fundem.' },
  { animation: 'Thinking', text: 'A fase acaba quando o x fica sozinho.' },
  { animation: 'GetAttention', text: 'Aperta Dica se travar. Eu falo o próximo passo.' },
  { animation: 'Acknowledge', text: 'Se eu tapar alguma coisa, me arrasta.' },
];

const TUTORIAL_SEEN = 'equalab-rover-tutorial';

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
    start() {
      const [hello, ...rest] = TUTORIAL_STEPS;
      agent.speak(hello.text);
      playIf(agent, hello.animation, 1200);
      for (const step of rest) agent.speak(step.text);
    },
    speakHint(html) {
      const text = plainHint(html);
      if (!text) return;
      interrupt(agent);
      agent.speak(text, { hold: true });
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

export async function attachTutor(game, storage = sessionStorage) {
  let pendingHint = null;
  let pendingWin = null;
  game.tutor = {
    speakHint(html) {
      pendingHint = html;
    },
    celebrate(solution) {
      pendingWin = solution;
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

  let seen = false;
  try {
    seen = storage.getItem(TUTORIAL_SEEN) === '1';
    if (!seen) storage.setItem(TUTORIAL_SEEN, '1');
  } catch {
    seen = false;
  }
  if (!seen) tutor.start();
}
