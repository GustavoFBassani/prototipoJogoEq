import { SoundEngine } from '@equalab/sound-engine';
import { initParticles } from './particles.js';
import { bootGame } from './game.js';
import './styles.css';

const sound = new SoundEngine();
const particles = initParticles();
bootGame({ sound, particles });
