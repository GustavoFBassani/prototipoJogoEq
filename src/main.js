import { SoundEngine } from '@equalab/sound-engine';
import { initParticles } from './particles.js';
import { bootGame } from './game.js';
import { attachTutor } from './tutor.js';
import './styles.css';

const sound = new SoundEngine();
const particles = initParticles();
const game = bootGame({ sound, particles });
attachTutor(game);
