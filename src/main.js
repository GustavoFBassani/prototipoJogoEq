import { SoundEngine } from '@equalab/sound-engine';
import { initParticles } from './particles.js';
import { bootGame } from './game.js';
import { attachTutor } from './tutor.js';
import { readSearch } from './activity-link.js';
import { mountEditor } from './editor.js';
import './styles.css';

const editor = document.getElementById('editor');

const located = readSearch(location.search);

if (located.mode === 'editor') {
  document.querySelector('body > header').hidden = true;
  document.querySelector('.app').hidden = true;
  editor.hidden = false;
  mountEditor({ root: editor, win: window });
} else {
  editor.hidden = true;
  const sound = new SoundEngine();
  const particles = initParticles();
  const play = located.mode === 'play';
  const levels = play
    ? located.activity.phases.map(({ title, hint, lhs, rhs, minSteps }, i) => ({ id: i + 1, title, hint, lhs, rhs, minSteps }))
    : undefined;
  const game = bootGame({ sound, particles, levels, activityName: play ? located.activity.name : undefined });
  attachTutor(game);
}
