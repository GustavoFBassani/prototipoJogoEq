/* =========================================================================
   1. MOTOR DE ÁUDIO SINTETIZADO (Web Audio API)
   ========================================================================= */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  }

  playAddOperation() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playDustAnnihilation() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.2);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(987.77, t);
    chime.frequency.exponentialRampToValueAtTime(1479.98, t + 0.18);
    chimeGain.gain.setValueAtTime(0.2, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);

    whiteNoise.start(t);
    chime.start(t);
    whiteNoise.stop(t + 0.22);
    chime.stop(t + 0.22);
  }

  playLevelWin() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(0.22, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.4);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const sound = new SoundEngine();

/* =========================================================================
   2. SISTEMA DE PARTÍCULAS CANVAS (Pó Cósmico & Confetes)
   ========================================================================= */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor(x, y, color, speed = 1, isDust = true) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isDust = isDust;
    const angle = Math.random() * Math.PI * 2;
    const velocity = (Math.random() * 4 + 2) * speed;
    this.vx = Math.cos(angle) * velocity;
    this.vy = Math.sin(angle) * velocity - (isDust ? 1.5 : 4);
    this.alpha = 1;
    this.size = isDust ? Math.random() * 5 + 3 : Math.random() * 8 + 4;
    this.decay = isDust ? Math.random() * 0.025 + 0.015 : Math.random() * 0.015 + 0.008;
    this.rotation = Math.random() * Math.PI;
    this.vRot = (Math.random() - 0.5) * 0.2;
    this.gravity = isDust ? 0.08 : 0.15;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.alpha -= this.decay;
    this.rotation += this.vRot;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    
    if (this.isDust) {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

function createDustExplosion(x, y, colorA = '#4ade80', colorB = '#c084fc') {
  const count = 35;
  for (let i = 0; i < count; i++) {
    const color = Math.random() > 0.5 ? colorA : colorB;
    particles.push(new Particle(x, y, color, 1.2, true));
  }
}

function createConfettiBurst(x, y) {
  const colors = ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color, 2.0, false));
  }
}

// Ativa um stream contínuo de canhões de confete para vitória final
function createEndGameConfettiShower() {
  const colors = ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#ffffff'];
  let count = 0;
  
  // Dispara rajadas contínuas de confetes por toda a extensão da tela
  const interval = setInterval(() => {
    // Dispara a partir de pontos aleatórios no topo e nas laterais
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.7);
    
    for (let i = 0; i < 50; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(new Particle(x, y, color, 2.8, false));
    }

    count++;
    if (count > 25) clearInterval(interval); // Mantém a celebração viva por ~4 segundos
  }, 120);
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* =========================================================================
   3. BANCO DE FASES DO JOGO
/* =========================================================================
   3. BANCO DE FASES DO JOGO & MOTOR ALGÉBRICO RACIONAL
   ========================================================================= */

// Utilitários de Álgebra Racional (p / q)
function normalizeRational(num, den) {
  if (num === 0) return { num: 0, den: 1 };
  if (den < 0) {
    num = -num;
    den = -den;
  }
  // Se for divisão exata, simplifica para inteiro
  if (num % den === 0) {
    return { num: num / den, den: 1 };
  }
  return { num, den };
}

function addRationals(n1, d1, n2, d2) {
  if (d1 === d2) {
    return normalizeRational(n1 + n2, d1);
  }
  const newDen = d1 * d2;
  const newNum = n1 * d2 + n2 * d1;
  return normalizeRational(newNum, newDen);
}

function multiplyRational(n, d, factor) {
  return normalizeRational(n * factor, d);
}

function divideRational(n, d, divisor) {
  if (divisor === 0) throw new Error("Divisão por zero não é permitida!");
  if (divisor < 0) {
    n = -n;
    divisor = -divisor;
  }
  return normalizeRational(n, d * divisor);
}

function parseLevelItem(item) {
  if (item.kind) {
    const num = item.num !== undefined ? item.num : 1;
    const den = item.den !== undefined ? item.den : 1;
    return { kind: item.kind, ...normalizeRational(num, den) };
  }
  if (item.type === '+x') return { kind: 'variable', num: 1, den: 1 };
  if (item.type === '-x') return { kind: 'variable', num: -1, den: 1 };
  if (item.type === '+1') return { kind: 'constant', num: 1, den: 1 };
  if (item.type === '-1') return { kind: 'constant', num: -1, den: 1 };
  return { kind: 'constant', num: 1, den: 1 };
}

const LEVELS = [
  {
    id: 1,
    title: "Primeiros Passos com Constantes",
    hint: "Aplique <b>-N</b> (com valor 2) aos dois lados ou arraste para aniquilar!",
    lhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 1, den: 1 }, { kind: 'constant', num: 1, den: 1 }],
    rhs: [{ kind: 'constant', num: 5, den: 1 }]
  },
  {
    id: 2,
    title: "Neutralizando Números Negativos",
    hint: "Tem <b>-3</b> na esquerda! Aplique <b>+N</b> com 3 em ambos os lados e aniquile os opostos!",
    lhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: -3, den: 1 }],
    rhs: [{ kind: 'constant', num: 2, den: 1 }]
  },
  {
    id: 3,
    title: "Descobrindo Resultados Negativos",
    hint: "Isole o x aplicando <b>-N</b> com 4 aos dois lados e aniquile os pares.",
    lhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 4, den: 1 }],
    rhs: [{ kind: 'constant', num: 1, den: 1 }]
  },
  {
    id: 4,
    title: "Variável nos Dois Lados",
    hint: "Existe <b>+1x</b> no lado direito! Aplique <b>-Nx</b> com 1 aos dois lados e aniquile o x da direita!",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: 1, den: 1 }],
    rhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 4, den: 1 }]
  },
  {
    id: 5,
    title: "Misturando Variáveis e Negativos",
    hint: "Elimine o <b>x</b> da direita com <b>-Nx</b> e elimine o <b>-2</b> da esquerda com <b>+N</b>.",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: -2, den: 1 }],
    rhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 3, den: 1 }]
  },
  {
    id: 6,
    title: "Balança com 3x",
    hint: "Aplique <b>-Nx</b> com 2 aos dois lados para cancelar o 2x da direita!",
    lhs: [{ kind: 'variable', num: 3, den: 1 }, { kind: 'constant', num: 1, den: 1 }],
    rhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: 5, den: 1 }]
  },
  {
    id: 7,
    title: "Equilíbrio com Negativos em Massa",
    hint: "Aplique <b>+N</b> com 5 para aniquilar o <b>-5</b> da esquerda!",
    lhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: -5, den: 1 }],
    rhs: [{ kind: 'constant', num: -2, den: 1 }]
  },
  {
    id: 8,
    title: "Constantes Negativas no Resultado",
    hint: "Primeiro aplique <b>-Nx</b> com 1 para remover o x da direita, depois <b>-N</b> com 4 para isolar o x.",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: 4, den: 1 }],
    rhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: -1, den: 1 }]
  },
  {
    id: 9,
    title: "O Desafio dos Sinais Opostos",
    hint: "Remova 2x da direita com <b>-Nx</b> com 2, depois adicione <b>+N</b> com 3 para neutralizar.",
    lhs: [{ kind: 'variable', num: 3, den: 1 }, { kind: 'constant', num: -3, den: 1 }],
    rhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: -7, den: 1 }]
  },
  {
    id: 10,
    title: "Mestre Alquimista da Álgebra",
    hint: "Isole a incógnita x reduzindo variáveis e constantes semelhantes.",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: 5, den: 1 }],
    rhs: [{ kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 3, den: 1 }]
  },
  {
    id: 11,
    title: "A Regra da Divisão",
    hint: "Primeiro remova as constantes com <b>-N</b> e depois use a operação <b>÷ N</b> com 2 para descobrir o valor de 1x!",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'constant', num: 2, den: 1 }],
    rhs: [{ kind: 'constant', num: 8, den: 1 }] // 2x + 2 = 8
  },
  {
    id: 12,
    title: "Desafio das Frações (4x = -3)",
    hint: "A balança aceita frações! Divida ambos os lados por <b>4</b> usando a operação <b>÷ N</b> para isolar o x em <b>-3/4</b>!",
    lhs: [{ kind: 'variable', num: 4, den: 1 }],
    rhs: [{ kind: 'constant', num: -3, den: 1 }] // 4x = -3
  },
  {
    id: 13,
    title: "Inversão de Sinais (-x = 7)",
    hint: "A incógnita está com sinal negativo! Divida ou multiplique por <b>-1</b> para inverter ambos os lados e obter +x!",
    lhs: [{ kind: 'variable', num: -1, den: 1 }],
    rhs: [{ kind: 'constant', num: 7, den: 1 }] // -x = 7
  },
  {
    id: 14,
    title: "Fusão e Grande Equilíbrio",
    hint: "Arraste elementos iguais no mesmo prato para fundi-los antes de resolver a equação.",
    lhs: [{ kind: 'variable', num: 2, den: 1 }, { kind: 'variable', num: 1, den: 1 }, { kind: 'constant', num: 4, den: 1 }],
    rhs: [{ kind: 'constant', num: 2, den: 1 }, { kind: 'constant', num: 8, den: 1 }] // 3x + 4 = 10
  }
];

/* =========================================================================
   4. ESTADO DO JOGO E CONTROLE
   ========================================================================= */
let currentLevelIndex = 0;
let lhsItems = [];
let rhsItems = [];
let itemIdCounter = 1;

const dropzoneLhs = document.getElementById('dropzone-lhs');
const dropzoneRhs = document.getElementById('dropzone-rhs');
const mathLhs = document.getElementById('math-lhs');
const mathRhs = document.getElementById('math-rhs');
const countLhs = document.getElementById('count-lhs');
const countRhs = document.getElementById('count-rhs');
const levelLabel = document.getElementById('current-level-label');
const levelGoalTitle = document.getElementById('level-goal-title');
const instructionHint = document.getElementById('instruction-hint');
const winModal = document.getElementById('win-modal');
const winSolText = document.getElementById('win-sol-text');
const levelsModal = document.getElementById('levels-modal');
const levelsGrid = document.getElementById('levels-grid');
const customModal = document.getElementById('custom-modal');

document.getElementById('btn-sound').addEventListener('click', (e) => {
  const active = sound.toggle();
  e.currentTarget.textContent = active ? '🔊' : '🔇';
});

document.getElementById('btn-levels').addEventListener('click', () => {
  renderLevelsPicker();
  levelsModal.classList.add('active');
});

document.getElementById('btn-close-levels').addEventListener('click', () => {
  levelsModal.classList.remove('active');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  loadLevel(currentLevelIndex);
});

document.getElementById('btn-hint').addEventListener('click', () => {
  const curLvl = LEVELS[currentLevelIndex];
  instructionHint.innerHTML = `💡 <b>Dica:</b> ${curLvl.hint}`;
  instructionHint.style.animation = 'pulse-target 0.6s 2';
});

document.getElementById('btn-next-level').addEventListener('click', () => {
  winModal.classList.remove('active');
  
  const isFinalLevel = (completedLevels.size >= LEVELS.length);

  if (isFinalLevel) {
    completedLevels.clear();
    loadLevel(0);
  } else if (currentLevelIndex < LEVELS.length - 1) {
    loadLevel(currentLevelIndex + 1);
  } else {
    loadLevel(0);
  }
});

document.getElementById('btn-custom-eq').addEventListener('click', () => {
  customModal.classList.add('active');
});

document.getElementById('btn-close-custom').addEventListener('click', () => {
  customModal.classList.remove('active');
});

document.getElementById('btn-start-custom').addEventListener('click', () => {
  const lx = parseInt(document.getElementById('cust-lx').value, 10) || 0;
  const lc = parseInt(document.getElementById('cust-lc').value, 10) || 0;
  const rx = parseInt(document.getElementById('cust-rx').value, 10) || 0;
  const rc = parseInt(document.getElementById('cust-rc').value, 10) || 0;

  // Validação: a != c para garantir solução única determinada
  if (lx === rx) {
    showCustomDialog({
      title: "Equação Inválida",
      desc: "Os coeficientes de x dos dois lados não podem ser iguais (isso resultaria em 0x, impossível ou indeterminado). Escolha valores diferentes!",
      icon: "⚠️",
      isAlert: true
    });
    return;
  }

  const customLhs = [];
  const customRhs = [];

  if (lx !== 0) customLhs.push({ kind: 'variable', num: lx, den: 1 });
  if (lc !== 0) customLhs.push({ kind: 'constant', num: lc, den: 1 });
  if (rx !== 0) customRhs.push({ kind: 'variable', num: rx, den: 1 });
  if (rc !== 0) customRhs.push({ kind: 'constant', num: rc, den: 1 });

  LEVELS.push({
    id: LEVELS.length + 1,
    title: "Laboratório Livre Personalizado",
    hint: "Isole a variável x aplicando operações equivalentes em ambos os lados e fundindo termos.",
    lhs: customLhs,
    rhs: customRhs
  });

  customModal.classList.remove('active');
  loadLevel(LEVELS.length - 1);
});

/* =========================================================================
   5. RENDERIZAÇÃO & MECÂNICA DE CARREGAMENTO
   ========================================================================= */
function loadLevel(index) {
  currentLevelIndex = index;
  const lvl = LEVELS[index];
  
  levelLabel.textContent = `${index + 1}/${LEVELS.length}`;
  levelGoalTitle.textContent = `Nível ${index + 1}: ${lvl.title}`;
  instructionHint.innerHTML = `💡 <b>Dica:</b> ${lvl.hint}`;

  lhsItems = lvl.lhs.map(item => {
    const parsed = parseLevelItem(item);
    return { id: itemIdCounter++, ...parsed, side: 'lhs' };
  });

  rhsItems = lvl.rhs.map(item => {
    const parsed = parseLevelItem(item);
    return { id: itemIdCounter++, ...parsed, side: 'rhs' };
  });

  renderAll();
}

function renderLevelsPicker() {
  levelsGrid.innerHTML = '';
  LEVELS.forEach((lvl, idx) => {
    const btn = document.createElement('button');
    btn.className = `lvl-btn ${idx === currentLevelIndex ? 'active' : ''}`;
    btn.textContent = `${idx + 1}`;
    btn.title = lvl.title;
    btn.addEventListener('click', () => {
      levelsModal.classList.remove('active');
      loadLevel(idx);
    });
    levelsGrid.appendChild(btn);
  });
}

function getTokenColors(item) {
  if (item.kind === 'variable') {
    return item.num > 0
      ? { main: '#0284c7', glow: '#38bdf8' }
      : { main: '#ea580c', glow: '#fb923c' };
  } else {
    return item.num > 0
      ? { main: '#16a34a', glow: '#4ade80' }
      : { main: '#9333ea', glow: '#c084fc' };
  }
}

function getTokenClasses(item) {
  if (item.kind === 'variable') {
    return item.num > 0 ? 'token-pos-x' : 'token-neg-x';
  } else {
    return item.num > 0 ? 'token-pos-1' : 'token-neg-1';
  }
}

function renderTokenContent(item) {
  const isVar = item.kind === 'variable';
  const sign = item.num > 0 ? '+' : '-';
  const absNum = Math.abs(item.num);
  const isFrac = item.den > 1;

  let mainHtml = '';
  if (isFrac) {
    mainHtml = `
      <div class="frac-container">
        <span>${sign}</span>
        <div class="frac-stack">
          <span class="frac-num">${absNum}</span>
          <span class="frac-den">${item.den}</span>
        </div>
        ${isVar ? '<span>x</span>' : ''}
      </div>
    `;
  } else {
    if (isVar) {
      mainHtml = absNum === 1 ? `<span>${sign}x</span>` : `<span>${sign}${absNum}x</span>`;
    } else {
      mainHtml = `<span>${sign}${absNum}</span>`;
    }
  }

  let subTxt = '';
  if (isVar) {
    subTxt = item.num > 0 ? 'variável' : 'anti-variável';
  } else {
    subTxt = item.num > 0 ? 'constante' : 'anti-constante';
  }

  return `
    ${mainHtml}
    <span class="token-sub-label">${subTxt}</span>
  `;
}

function renderContainer(items, containerEl, sideName) {
  containerEl.innerHTML = '';
  
  if (items.length === 0) {
    containerEl.classList.add('empty-state');
  } else {
    containerEl.classList.remove('empty-state');
  }

  items.forEach(item => {
    const el = document.createElement('div');
    const typeClass = getTokenClasses(item);

    el.className = `game-token ${typeClass}`;
    el.dataset.id = item.id;
    el.dataset.kind = item.kind;
    el.dataset.side = sideName;

    el.innerHTML = renderTokenContent(item);

    setupDrag(el, item, sideName);
    containerEl.appendChild(el);
  });
}

function formatAlgebraicSide(items) {
  if (items.length === 0) return '0';

  return items.map((item, index) => {
    const isVar = item.kind === 'variable';
    const isFrac = item.den > 1;
    const absNum = Math.abs(item.num);
    const isNegative = item.num < 0;

    let termStr = '';
    if (isFrac) {
      termStr = isVar ? `${absNum}/${item.den}x` : `${absNum}/${item.den}`;
    } else {
      if (isVar) {
        termStr = absNum === 1 ? 'x' : `${absNum}x`;
      } else {
        termStr = `${absNum}`;
      }
    }

    if (index === 0) {
      return isNegative ? `-${termStr}` : termStr;
    } else {
      return isNegative ? `- ${termStr}` : `+ ${termStr}`;
    }
  }).join(' ');
}

function renderAll() {
  renderContainer(lhsItems, dropzoneLhs, 'lhs');
  renderContainer(rhsItems, dropzoneRhs, 'rhs');

  countLhs.textContent = `${lhsItems.length} ${lhsItems.length === 1 ? 'item' : 'itens'}`;
  countRhs.textContent = `${rhsItems.length} ${rhsItems.length === 1 ? 'item' : 'itens'}`;

  mathLhs.textContent = formatAlgebraicSide(lhsItems);
  mathRhs.textContent = formatAlgebraicSide(rhsItems);

  checkWinCondition();
}

/* =========================================================================
   6. APLICAÇÃO DE OPERAÇÃO NOS DOIS LADOS
   ========================================================================= */
document.querySelectorAll('.op-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const op = btn.dataset.op;
    applyOperationBothSides(op);
  });
});

/* =========================================================================
   SISTEMA DE MODAL PERSONALIZADO
   ========================================================================= */
const inputModal = document.getElementById('input-modal');
const inputModalTitle = document.getElementById('input-modal-title');
const inputModalDesc = document.getElementById('input-modal-desc');
const inputModalIcon = document.getElementById('input-modal-icon');
const inputModalField = document.getElementById('input-modal-value');
const inputModalFieldContainer = document.getElementById('input-modal-field-container');
const btnInputConfirm = document.getElementById('btn-input-confirm');
const btnInputCancel = document.getElementById('btn-input-cancel');

function showCustomDialog({ title, desc, icon, isAlert = false, defaultValue = "1", onConfirm }) {
  inputModalTitle.textContent = title;
  inputModalDesc.textContent = desc;
  inputModalIcon.textContent = icon || '🧪';

  if (isAlert) {
    inputModalFieldContainer.style.display = 'none';
    btnInputCancel.style.display = 'none';
    btnInputConfirm.textContent = 'Entendido';
  } else {
    inputModalFieldContainer.style.display = 'block';
    btnInputCancel.style.display = 'flex';
    btnInputConfirm.textContent = 'Confirmar';
    inputModalField.value = defaultValue;
    setTimeout(() => {
      inputModalField.focus();
      inputModalField.select();
    }, 100);
  }

  inputModal.classList.add('active');

  const handleConfirm = () => {
    const val = parseFloat(inputModalField.value);
    cleanup();
    inputModal.classList.remove('active');
    if (onConfirm) onConfirm(val);
  };

  const handleCancel = () => {
    cleanup();
    inputModal.classList.remove('active');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const cleanup = () => {
    btnInputConfirm.removeEventListener('click', handleConfirm);
    btnInputCancel.removeEventListener('click', handleCancel);
    inputModalField.removeEventListener('keydown', handleKeyDown);
  };

  btnInputConfirm.addEventListener('click', handleConfirm);
  btnInputCancel.addEventListener('click', handleCancel);
  inputModalField.addEventListener('keydown', handleKeyDown);
}

/* =========================================================================
   APLICAÇÃO DE OPERAÇÕES BILATERAIS COM VALIDAÇÃO COMPLETA
   ========================================================================= */
function applyOperationBothSides(opType) {
  let title = '';
  let desc = '';
  let icon = '';
  let defaultVal = '1';

  switch (opType) {
    case '+N':
      title = 'Adicionar Constante (+N)';
      desc = 'Qual valor constante N você deseja SOMAR a ambos os lados?';
      icon = '➕';
      defaultVal = '1';
      break;
    case '-N':
      title = 'Subtrair Constante (-N)';
      desc = 'Qual valor constante N você deseja SUBTRAIR de ambos os lados?';
      icon = '➖';
      defaultVal = '1';
      break;
    case '+Nx':
      title = 'Adicionar Variável (+Nx)';
      desc = 'Quantas variáveis x você deseja SOMAR a ambos os lados?';
      icon = '🔷';
      defaultVal = '1';
      break;
    case '-Nx':
      title = 'Subtrair Variável (-Nx)';
      desc = 'Quantas variáveis x você deseja SUBTRAIR de ambos os lados?';
      icon = '🔶';
      defaultVal = '1';
      break;
    case '*N':
      title = 'Multiplicação por N (× N)';
      desc = 'Por qual número N você deseja MULTIPLICAR ambos os lados?';
      icon = '✖️';
      defaultVal = '2';
      break;
    case '/N':
      title = 'Divisão por N (÷ N)';
      desc = 'Por qual número N você deseja DIVIDIR ambos os lados?';
      icon = '➗';
      defaultVal = '2';
      break;
  }

  showCustomDialog({
    title,
    desc,
    icon,
    defaultValue: defaultVal,
    onConfirm: (n) => {
      if (isNaN(n)) {
        showCustomDialog({
          title: 'Valor Inválido',
          desc: 'Por favor, insira um número válido.',
          icon: '⚠️',
          isAlert: true
        });
        return;
      }

      if (opType === '*N' || opType === '/N') {
        if (n === 0) {
          showCustomDialog({
            title: 'Operação Indefinida',
            desc: opType === '/N'
              ? 'A divisão por zero é indefinida na matemática e desequilibra a balança!'
              : 'Multiplicar por zero anularia toda a equação, destruindo os dois membros.',
            icon: '⛔',
            isAlert: true
          });
          return;
        }

        sound.playAddOperation();

        if (opType === '*N') {
          lhsItems = lhsItems.map(item => {
            const res = multiplyRational(item.num, item.den, n);
            return { ...item, num: res.num, den: res.den };
          });
          rhsItems = rhsItems.map(item => {
            const res = multiplyRational(item.num, item.den, n);
            return { ...item, num: res.num, den: res.den };
          });
        } else {
          // Divisão distributiva irrestrita (suporta frações em qualquer estágio)
          lhsItems = lhsItems.map(item => {
            const res = divideRational(item.num, item.den, n);
            return { ...item, num: res.num, den: res.den };
          });
          rhsItems = rhsItems.map(item => {
            const res = divideRational(item.num, item.den, n);
            return { ...item, num: res.num, den: res.den };
          });
        }

        createDustExplosion(window.innerWidth * 0.3, window.innerHeight * 0.5, '#f59e0b', '#38bdf8');
        createDustExplosion(window.innerWidth * 0.7, window.innerHeight * 0.5, '#f59e0b', '#c084fc');
        renderAll();
        return;
      }

      if (n === 0) {
        showCustomDialog({
          title: 'Elemento Neutro',
          desc: 'Somar ou subtrair 0 não altera a equação.',
          icon: '💡',
          isAlert: true
        });
        return;
      }

      sound.playAddOperation();

      if (opType === '+N') {
        lhsItems.push({ id: itemIdCounter++, kind: 'constant', num: n, den: 1, side: 'lhs' });
        rhsItems.push({ id: itemIdCounter++, kind: 'constant', num: n, den: 1, side: 'rhs' });
      } else if (opType === '-N') {
        lhsItems.push({ id: itemIdCounter++, kind: 'constant', num: -n, den: 1, side: 'lhs' });
        rhsItems.push({ id: itemIdCounter++, kind: 'constant', num: -n, den: 1, side: 'rhs' });
      } else if (opType === '+Nx') {
        lhsItems.push({ id: itemIdCounter++, kind: 'variable', num: n, den: 1, side: 'lhs' });
        rhsItems.push({ id: itemIdCounter++, kind: 'variable', num: n, den: 1, side: 'rhs' });
      } else if (opType === '-Nx') {
        lhsItems.push({ id: itemIdCounter++, kind: 'variable', num: -n, den: 1, side: 'lhs' });
        rhsItems.push({ id: itemIdCounter++, kind: 'variable', num: -n, den: 1, side: 'rhs' });
      }

      renderAll();
    }
  });
}

/* =========================================================================
   7. SISTEMA DE DRAG & DROP: FUSÃO E ANIQUILAÇÃO PARCIAL/TOTAL
   ========================================================================= */
let activeDrag = null;

function setupDrag(element, item, sideName) {
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      element.setPointerCapture(e.pointerId);
    } catch (err) {}

    activeDrag = {
      element: element,
      item: item,
      side: sideName,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      targetToken: null,
      isFusion: false
    };

    element.classList.add('dragging');
  });

  element.addEventListener('pointermove', (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    element.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.18)`;

    // Detecção de colisão estritamente no mesmo prato da balança
    const targetSideDropzone = activeDrag.side === 'lhs' ? dropzoneLhs : dropzoneRhs;
    const tokens = targetSideDropzone.querySelectorAll('.game-token:not(.dragging)');
    const currentList = activeDrag.side === 'lhs' ? lhsItems : rhsItems;

    let foundTarget = null;
    let isFusion = false;

    tokens.forEach(otherEl => {
      const oRect = otherEl.getBoundingClientRect();
      const isOver = (
        e.clientX >= oRect.left &&
        e.clientX <= oRect.right &&
        e.clientY >= oRect.top &&
        e.clientY <= oRect.bottom
      );

      if (isOver) {
        const targetId = parseInt(otherEl.dataset.id, 10);
        const targetItem = currentList.find(i => i.id === targetId);
        
        // Elementos em comum (mesma natureza: variável com variável ou constante com constante)
        if (targetItem && targetItem.kind === activeDrag.item.kind) {
          foundTarget = otherEl;
          isFusion = (activeDrag.item.num > 0) === (targetItem.num > 0);
        }
      }
    });

    tokens.forEach(otherEl => {
      if (otherEl === foundTarget) {
        if (isFusion) {
          otherEl.classList.add('hover-fuse');
          otherEl.classList.remove('hover-target');
        } else {
          otherEl.classList.add('hover-target');
          otherEl.classList.remove('hover-fuse');
        }
      } else {
        otherEl.classList.remove('hover-target', 'hover-fuse');
      }
    });

    activeDrag.targetToken = foundTarget;
    activeDrag.isFusion = isFusion;
  });

  const handleDragEnd = (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    try {
      element.releasePointerCapture(e.pointerId);
    } catch (err) {}

    element.classList.remove('dragging');
    element.style.transform = '';

    if (activeDrag.targetToken) {
      const targetId = parseInt(activeDrag.targetToken.dataset.id, 10);
      const sourceId = activeDrag.item.id;
      const targetList = activeDrag.side === 'lhs' ? lhsItems : rhsItems;
      const targetItem = targetList.find(i => i.id === targetId);
      const sourceItem = activeDrag.item;

      if (targetItem && targetItem.kind === sourceItem.kind) {
        const rect = activeDrag.targetToken.getBoundingClientRect();
        const burstX = rect.left + rect.width / 2;
        const burstY = rect.top + rect.height / 2;

        const colorSource = getTokenColors(sourceItem).glow;
        const colorTarget = getTokenColors(targetItem).glow;

        const isFusion = (sourceItem.num > 0) === (targetItem.num > 0);
        const sum = addRationals(sourceItem.num, sourceItem.den, targetItem.num, targetItem.den);

        if (sum.num === 0) {
          // Aniquilação completa: ambos os termos se neutralizam
          createDustExplosion(burstX, burstY, colorSource, colorTarget);
          sound.playDustAnnihilation();

          if (activeDrag.side === 'lhs') {
            lhsItems = lhsItems.filter(i => i.id !== sourceId && i.id !== targetId);
          } else {
            rhsItems = rhsItems.filter(i => i.id !== sourceId && i.id !== targetId);
          }
        } else {
          // Fusão (mesmo sinal) ou Aniquilação Parcial (sinais opostos)
          if (isFusion) {
            createDustExplosion(burstX, burstY, colorSource, '#ffffff');
            sound.playAddOperation();
          } else {
            createDustExplosion(burstX, burstY, colorSource, colorTarget);
            sound.playDustAnnihilation();
          }

          targetItem.num = sum.num;
          targetItem.den = sum.den;

          if (activeDrag.side === 'lhs') {
            lhsItems = lhsItems.filter(i => i.id !== sourceId);
          } else {
            rhsItems = rhsItems.filter(i => i.id !== sourceId);
          }
        }

        renderAll();
      }
    } else {
      const targetSideDropzone = activeDrag.side === 'lhs' ? dropzoneLhs : dropzoneRhs;
      targetSideDropzone.querySelectorAll('.game-token').forEach(t => t.classList.remove('hover-target', 'hover-fuse'));
      element.style.transform = '';
    }

    activeDrag = null;
  };

  element.addEventListener('pointerup', handleDragEnd);
  element.addEventListener('pointercancel', handleDragEnd);
}

/* =========================================================================
   8. VALIDAÇÃO DE VITÓRIA ESTREITA E ISOLAMENTO DO X
   ========================================================================= */
const completedLevels = new Set();

function checkWinCondition() {
  // Vitória Estrita: exige que todos os termos semelhantes tenham sido fundidos,
  // restando apenas 1 elemento de cada lado da balança.
  if (lhsItems.length !== 1 || rhsItems.length !== 1) {
    return;
  }

  const left = lhsItems[0];
  const right = rhsItems[0];

  // Cenário A: +1x isolado à esquerda, e uma constante à direita
  const leftIsolated = (
    left.kind === 'variable' && left.num === 1 && left.den === 1 &&
    right.kind === 'constant'
  );

  // Cenário B: +1x isolado à direita, e uma constante à esquerda
  const rightIsolated = (
    right.kind === 'variable' && right.num === 1 && right.den === 1 &&
    left.kind === 'constant'
  );

  if (leftIsolated || rightIsolated) {
    const constTerm = leftIsolated ? right : left;
    completedLevels.add(currentLevelIndex);

    setTimeout(() => {
      triggerVictory(constTerm);
    }, 300);
  }
}

function formatSolution(constTerm) {
  const isFrac = constTerm.den > 1;
  if (!isFrac) {
    return `x = ${constTerm.num}`;
  }
  const sign = constTerm.num < 0 ? '-' : '';
  const absNum = Math.abs(constTerm.num);
  return `x = ${sign}${absNum}/${constTerm.den}`;
}

function triggerVictory(constTerm) {
  sound.playLevelWin();

  const isFinalLevel = (completedLevels.size >= LEVELS.length);

  if (isFinalLevel) {
    createEndGameConfettiShower();
    
    document.querySelector('.win-trophy').textContent = '👑';
    document.querySelector('.win-title').textContent = 'Mestre da Álgebra!';
    document.getElementById('win-message').textContent = 
      `Parabéns! Você concluiu todos os ${LEVELS.length} níveis do EquaLab e dominou as equações de 1º grau!`;
    document.getElementById('btn-next-level').textContent = '🎮 Jogar Novamente';
  } else {
    createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Equação Resolvida!';
    document.getElementById('win-message').textContent = 
      'Excelente trabalho! Você isolou o x perfeitamente mantendo o equilíbrio em ambos os pratos.';
    document.getElementById('btn-next-level').textContent = 'Próxima Fase ➔';
  }

  winSolText.textContent = formatSolution(constTerm);
  winModal.classList.add('active');
}

loadLevel(0);