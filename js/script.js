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
   ========================================================================= */
const LEVELS = [
  {
    id: 1,
    title: "Primeiros Passos com Constantes",
    hint: "Aplique <b>-1</b> duas vezes para cancelar os <b>+1</b> da esquerda, depois aniquile arrastando +1 no -1!",
    lhs: [{ type: '+x' }, { type: '+1' }, { type: '+1' }],
    rhs: [{ type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }]
  },
  {
    id: 2,
    title: "Neutralizando Números Negativos",
    hint: "Tem <b>-1</b> na esquerda! Aplique <b>+1</b> em ambos os lados e junte com o <b>-1</b> para virar pó!",
    lhs: [{ type: '+x' }, { type: '-1' }, { type: '-1' }, { type: '-1' }],
    rhs: [{ type: '+1' }, { type: '+1' }]
  },
  {
    id: 3,
    title: "Descobrindo Resultados Negativos",
    hint: "Isole o x aplicando <b>-1</b> quatro vezes aos dois lados e aniquile os pares.",
    lhs: [{ type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }],
    rhs: [{ type: '+1' }]
  },
  {
    id: 4,
    title: "Variável nos Dois Lados",
    hint: "Existe um <b>+x</b> no lado direito! Aplique <b>-x</b> em ambos os lados e aniquile os <b>x</b> da direita!",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+1' }],
    rhs: [{ type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }]
  },
  {
    id: 5,
    title: "Misturando Variáveis e Negativos",
    hint: "Elimine o <b>x</b> da direita com <b>-x</b> e elimine os <b>-1</b> da esquerda com <b>+1</b>.",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '-1' }, { type: '-1' }],
    rhs: [{ type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }]
  },
  {
    id: 6,
    title: "Balança Tripla com 3x",
    hint: "Aplique <b>-x</b> duas vezes aos dois lados para cancelar 2x da direita!",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+x' }, { type: '+1' }],
    rhs: [{ type: '+x' }, { type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }]
  },
  {
    id: 7,
    title: "Equilíbrio com Negativos em Massa",
    hint: "Aplique <b>+1</b> cinco vezes para aniquilar todos os <b>-1</b> da esquerda!",
    lhs: [{ type: '+x' }, { type: '-1' }, { type: '-1' }, { type: '-1' }, { type: '-1' }, { type: '-1' }],
    rhs: [{ type: '-1' }, { type: '-1' }]
  },
  {
    id: 8,
    title: "Constantes Negativas no Resultado",
    hint: "Primeiro aplique <b>-x</b> para remover x da direita, depois <b>-1</b> para isolar o x.",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }],
    rhs: [{ type: '+x' }, { type: '-1' }]
  },
  {
    id: 9,
    title: "O Grande Desafio dos Sinais Opostos",
    hint: "Remova 2x da direita aplicando <b>-x</b> duas vezes, depois adicione <b>+1</b> para neutralizar.",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+x' }, { type: '-1' }, { type: '-1' }, { type: '-1' }],
    rhs: [{ type: '+x' }, { type: '+x' }, { type: '-1' }, { type: '-1' }, { type: '-1' }, { type: '-1' }, { type: '-1' }, { type: '-1' }]
  },
  {
    id: 10,
    title: "Mestre Alquimista da Álgebra",
    hint: "Você domina o método da operação bilateral! Isole o x nesta equação equilibrada.",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }],
    rhs: [{ type: '+x' }, { type: '+1' }, { type: '+1' }, { type: '+1' }]
  },
  // Exemplo de nível que exige divisão por 2 no final:
  {
    id: 11,
    title: "A Regra da Divisão",
    hint: "Primeiro remova as constantes com <b>-1</b> e depois use a operação <b>÷ 2</b> para descobrir o valor de 1x!",
    lhs: [{ type: '+x' }, { type: '+x' }, { type: '+1' }, { type: '+1' }],
    rhs: [{ type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }, { type: '+1' }] // 2x + 2 = 8
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
  
  // Verifica se o jogador já concluiu todas as fases
  const isFinalLevel = (completedLevels.size >= LEVELS.length);

  if (isFinalLevel) {
    // Reseta o histórico de fases concluídas para o novo ciclo
    completedLevels.clear();
    // Recomeça o jogo na Fase 1 (índice 0)
    loadLevel(0);
  } else if (currentLevelIndex < LEVELS.length - 1) {
    // Avança para a próxima fase durante o progresso normal
    loadLevel(currentLevelIndex + 1);
  } else {
    // Caso de segurança: volta para a Fase 1
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
  const lx = parseInt(document.getElementById('cust-lx').value) || 0;
  const lc = parseInt(document.getElementById('cust-lc').value) || 0;
  const rx = parseInt(document.getElementById('cust-rx').value) || 0;
  const rc = parseInt(document.getElementById('cust-rc').value) || 0;

  const customLhs = [];
  const customRhs = [];

  for (let i = 0; i < Math.abs(lx); i++) customLhs.push({ type: lx > 0 ? '+x' : '-x' });
  for (let i = 0; i < Math.abs(lc); i++) customLhs.push({ type: lc > 0 ? '+1' : '-1' });
  for (let i = 0; i < Math.abs(rx); i++) customRhs.push({ type: rx > 0 ? '+x' : '-x' });
  for (let i = 0; i < Math.abs(rc); i++) customRhs.push({ type: rc > 0 ? '+1' : '-1' });

  LEVELS.push({
    id: LEVELS.length + 1,
    title: "Laboratório Livre Personalizado",
    hint: "Isole a variável x aplicando operações equivalentes em ambos os lados.",
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

  lhsItems = lvl.lhs.map(item => ({ id: itemIdCounter++, type: item.type }));
  rhsItems = lvl.rhs.map(item => ({ id: itemIdCounter++, type: item.type }));

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

function areOpposites(typeA, typeB) {
  return (
    (typeA === '+1' && typeB === '-1') ||
    (typeA === '-1' && typeB === '+1') ||
    (typeA === '+x' && typeB === '-x') ||
    (typeA === '-x' && typeB === '+x')
  );
}

function getTokenColors(type) {
  switch (type) {
    case '+x': return { main: '#0284c7', glow: '#38bdf8' };
    case '-x': return { main: '#ea580c', glow: '#fb923c' };
    case '+1': return { main: '#16a34a', glow: '#4ade80' };
    case '-1': return { main: '#9333ea', glow: '#c084fc' };
  }
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
    let typeClass = '';
    let subTxt = '';
    if (item.type === '+x') {
      typeClass = 'token-pos-x';
      subTxt = 'variável';
    } else if (item.type === '-x') {
      typeClass = 'token-neg-x';
      subTxt = 'anti-x';
    } else if (item.type === '+1') {
      typeClass = 'token-pos-1';
      subTxt = 'unidade';
    } else if (item.type === '-1') {
      typeClass = 'token-neg-1';
      subTxt = 'anti-1';
    }

    el.className = `game-token ${typeClass}`;
    el.dataset.id = item.id;
    el.dataset.type = item.type;
    el.dataset.side = sideName;

    el.innerHTML = `
      <span>${item.type}</span>
      <span class="token-sub-label">${subTxt}</span>
    `;

    setupDrag(el, item, sideName);
    containerEl.appendChild(el);
  });
}

function formatAlgebraicSide(items) {
  if (items.length === 0) return '0';

  // 1. Conta o total de x e de constantes
  let countX = 0;
  let countNum = 0;

  items.forEach(item => {
    if (item.type === '+x') countX += 1;
    if (item.type === '-x') countX -= 1;
    if (item.type === '+1') countNum += 1;
    if (item.type === '-1') countNum -= 1;
  });

  if (countX === 0 && countNum === 0) return '0';

  const parts = [];

  // 2. Formata o termo de X
  if (countX !== 0) {
    if (countX === 1) parts.push('x');
    else if (countX === -1) parts.push('-x');
    else parts.push(`${countX}x`);
  }

  // 3. Formata o termo constante
  if (countNum !== 0) {
    if (parts.length > 0) {
      // Se já existe um termo 'x', adiciona o sinal com espaço
      if (countNum > 0) parts.push(`+ ${countNum}`);
      else parts.push(`- ${Math.abs(countNum)}`);
    } else {
      // Se é o primeiro termo do lado
      parts.push(`${countNum}`);
    }
  }

  return parts.join(' ');
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
   SISTEMA DE MODAL PERSONALIZADO (Substituição de prompt e alert)
   ========================================================================= */
const inputModal = document.getElementById('input-modal');
const inputModalTitle = document.getElementById('input-modal-title');
const inputModalDesc = document.getElementById('input-modal-desc');
const inputModalIcon = document.getElementById('input-modal-icon');
const inputModalField = document.getElementById('input-modal-value');
const inputModalFieldContainer = document.getElementById('input-modal-field-container');
const btnInputConfirm = document.getElementById('btn-input-confirm');
const btnInputCancel = document.getElementById('btn-input-cancel');

function showCustomDialog({ title, desc, icon, isAlert = false, defaultValue = "2", onConfirm }) {
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
    setTimeout(() => inputModalField.focus(), 100);
  }

  inputModal.classList.add('active');

  const handleConfirm = () => {
    const val = parseInt(inputModalField.value);
    cleanup();
    inputModal.classList.remove('active');
    if (onConfirm) onConfirm(val);
  };

  const handleCancel = () => {
    cleanup();
    inputModal.classList.remove('active');
  };

  const cleanup = () => {
    btnInputConfirm.removeEventListener('click', handleConfirm);
    btnInputCancel.removeEventListener('click', handleCancel);
  };

  btnInputConfirm.addEventListener('click', handleConfirm);
  btnInputCancel.addEventListener('click', handleCancel);
}

/* =========================================================================
   APLICAÇÃO DE OPERAÇÃO COM MODAL EMBUTIDO
   ========================================================================= */
function applyOperationBothSides(opType) {
  if (opType === '*N' || opType === '/N') {
    const isMult = opType === '*N';

    showCustomDialog({
      title: isMult ? "Multiplicação por N" : "Divisão por N",
      desc: isMult 
        ? "Por qual número N você deseja MULTIPLICAR ambos os lados?" 
        : "Por qual número N você deseja DIVIDIR ambos os lados?",
      icon: isMult ? '✖️' : '➗',
      defaultValue: "2",
      onConfirm: (n) => {
        if (isNaN(n) || n <= 1) {
          showCustomDialog({
            title: "Valor Inválido",
            desc: "Por favor, insira um número inteiro maior que 1.",
            icon: "⚠️",
            isAlert: true
          });
          return;
        }

        if (isMult) {
          sound.playAddOperation();
          const originalLhs = [...lhsItems];
          const originalRhs = [...rhsItems];

          for (let count = 1; count < n; count++) {
            originalLhs.forEach(item => lhsItems.push({ id: itemIdCounter++, type: item.type }));
            originalRhs.forEach(item => rhsItems.push({ id: itemIdCounter++, type: item.type }));
          }
          renderAll();
        } else {
          // Validação de divisibilidade
          const canDivide = (items) => {
            const counts = {};
            items.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
            return Object.values(counts).every(c => c % n === 0);
          };

          if (canDivide(lhsItems) && canDivide(rhsItems) && lhsItems.length > 0 && rhsItems.length > 0) {
            sound.playAddOperation();

            const reduceByN = (items) => {
              const counts = {};
              const result = [];
              items.forEach(i => {
                counts[i.type] = (counts[i.type] || 0) + 1;
                if (counts[i.type] % n === 1) result.push(i);
              });
              return result;
            };

            lhsItems = reduceByN(lhsItems);
            rhsItems = reduceByN(rhsItems);

            createDustExplosion(window.innerWidth * 0.3, window.innerHeight * 0.5, '#f59e0b', '#38bdf8');
            createDustExplosion(window.innerWidth * 0.7, window.innerHeight * 0.5, '#f59e0b', '#c084fc');
            renderAll();
          } else {
            showCustomDialog({
              title: "Operação Impossível",
              desc: `Para dividir por ${n}, todos os grupos de elementos nos dois lados precisam ter quantidades divisíveis por ${n}!`,
              icon: "⚠️",
              isAlert: true
            });
          }
        }
      }
    });
  } 
  else {
    sound.playAddOperation();
    lhsItems.push({ id: itemIdCounter++, type: opType });
    rhsItems.push({ id: itemIdCounter++, type: opType });
    renderAll();
  }
}

/* =========================================================================
   7. SISTEMA DE DRAG & DROP SUAVE VIA TRANSLATE (Sem Pulo de Coordenadas)
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
      targetToken: null
    };

    element.classList.add('dragging');
  });

  element.addEventListener('pointermove', (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    // Usa translate3d para movimento suave sem alterar fluxo de layout
    element.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.18)`;

    // Detecção de colisão com outros tokens no mesmo container
    const targetSideDropzone = activeDrag.side === 'lhs' ? dropzoneLhs : dropzoneRhs;
    const tokens = targetSideDropzone.querySelectorAll('.game-token:not(.dragging)');

    let foundTarget = null;
    tokens.forEach(otherEl => {
      const oRect = otherEl.getBoundingClientRect();
      const isOver = (
        e.clientX >= oRect.left &&
        e.clientX <= oRect.right &&
        e.clientY >= oRect.top &&
        e.clientY <= oRect.bottom
      );

      if (isOver && areOpposites(activeDrag.item.type, otherEl.dataset.type)) {
        foundTarget = otherEl;
      }
    });

    // Feedback visual na peça alvo
    tokens.forEach(otherEl => {
      if (otherEl === foundTarget) {
        otherEl.classList.add('hover-target');
      } else {
        otherEl.classList.remove('hover-target');
      }
    });

    activeDrag.targetToken = foundTarget;
  });

  const handleDragEnd = (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    try {
      element.releasePointerCapture(e.pointerId);
    } catch (err) {}

    element.classList.remove('dragging');
    element.style.transform = '';

    if (activeDrag.targetToken) {
      const targetId = parseInt(activeDrag.targetToken.dataset.id);
      const sourceId = activeDrag.item.id;
      const targetType = activeDrag.targetToken.dataset.type;

      const rect = activeDrag.targetToken.getBoundingClientRect();
      const burstX = rect.left + rect.width / 2;
      const burstY = rect.top + rect.height / 2;

      const colorA = getTokenColors(activeDrag.item.type).glow;
      const colorB = getTokenColors(targetType).glow;
      createDustExplosion(burstX, burstY, colorA, colorB);
      sound.playDustAnnihilation();

      if (activeDrag.side === 'lhs') {
        lhsItems = lhsItems.filter(i => i.id !== sourceId && i.id !== targetId);
      } else {
        rhsItems = rhsItems.filter(i => i.id !== sourceId && i.id !== targetId);
      }

      renderAll();
    } else {
      // Limpa alvos se soltou no vazio
      const targetSideDropzone = activeDrag.side === 'lhs' ? dropzoneLhs : dropzoneRhs;
      targetSideDropzone.querySelectorAll('.game-token').forEach(t => t.classList.remove('hover-target'));
      element.style.transform = '';
    }

    activeDrag = null;
  };

  element.addEventListener('pointerup', handleDragEnd);
  element.addEventListener('pointercancel', handleDragEnd);
}

/* =========================================================================
   8. VALIDAÇÃO DE VITÓRIA E ISOLAMENTO DO X
   ========================================================================= */

const completedLevels = new Set(); // Registra as fases concluídas

function checkWinCondition() {
  const lPosX = lhsItems.filter(i => i.type === '+x').length;
  const lNegX = lhsItems.filter(i => i.type === '-x').length;
  const lPos1 = lhsItems.filter(i => i.type === '+1').length;
  const lNeg1 = lhsItems.filter(i => i.type === '-1').length;

  const rPosX = rhsItems.filter(i => i.type === '+x').length;
  const rNegX = rhsItems.filter(i => i.type === '-x').length;
  const rPos1 = rhsItems.filter(i => i.type === '+1').length;
  const rNeg1 = rhsItems.filter(i => i.type === '-1').length;

  const leftIsolated = (
    lPosX === 1 && lNegX === 0 && lPos1 === 0 && lNeg1 === 0 &&
    rPosX === 0 && rNegX === 0 && (rPos1 === 0 || rNeg1 === 0)
  );

  const rightIsolated = (
    rPosX === 1 && rNegX === 0 && rPos1 === 0 && rNeg1 === 0 &&
    lPosX === 0 && lNegX === 0 && (lPos1 === 0 || lNeg1 === 0)
  );

  if (leftIsolated || rightIsolated) {
    let finalVal = 0;
    if (leftIsolated) {
      finalVal = rPos1 - rNeg1;
    } else {
      finalVal = lPos1 - lNeg1;
    }

    // REGISTRA A FASE COMO CONCLUÍDA
    completedLevels.add(currentLevelIndex);

    setTimeout(() => {
      triggerVictory(finalVal);
    }, 300);
  }
}

function triggerVictory(value) {
  sound.playLevelWin();

  // Valida se todas as fases já foram vencidas:
  const isFinalLevel = (completedLevels.size >= LEVELS.length);

  if (isFinalLevel) {
    // Grande celebração por ganhar todas as fases
    createEndGameConfettiShower();
    
    document.querySelector('.win-trophy').textContent = '👑';
    document.querySelector('.win-title').textContent = 'Mestre da Álgebra!';
    document.getElementById('win-message').textContent = 
      'Parabéns! Você concluiu todos os 11 níveis do EquaLab e dominou o equilíbrio algébrico!';
    document.getElementById('btn-next-level').textContent = '🎮 Jogar Novamente';
  } else {
    // Vitória em fases normais
    createConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    
    document.querySelector('.win-trophy').textContent = '🏆';
    document.querySelector('.win-title').textContent = 'Equação Resolvida!';
    document.getElementById('win-message').textContent = 
      'Excelente trabalho! Você isolou o x mantendo o equilíbrio perfeito em ambos os lados.';
    document.getElementById('btn-next-level').textContent = 'Próxima Fase ➔';
  }

  winSolText.textContent = `x = ${value}`;
  winModal.classList.add('active');
}

loadLevel(0);