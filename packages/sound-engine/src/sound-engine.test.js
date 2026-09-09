import { describe, it, expect, vi } from 'vitest';
import { SoundEngine } from './sound-engine.js';

function createAudioParam() {
  return {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function createOscillator() {
  return {
    type: 'sine',
    frequency: createAudioParam(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createGain() {
  return {
    gain: createAudioParam(),
    connect: vi.fn(),
  };
}

function createFilter() {
  return {
    type: 'lowpass',
    frequency: createAudioParam(),
    Q: createAudioParam(),
    connect: vi.fn(),
  };
}

function createBufferSource() {
  return {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockAudioContext({ currentTime = 10, sampleRate = 44100 } = {}) {
  const oscillators = [];
  const gains = [];
  const filters = [];
  const sources = [];
  const buffers = [];

  class MockAudioContext {
    constructor() {
      this.currentTime = currentTime;
      this.sampleRate = sampleRate;
      this.destination = { id: 'destination' };
    }

    createOscillator() {
      const osc = createOscillator();
      oscillators.push(osc);
      return osc;
    }

    createGain() {
      const gain = createGain();
      gains.push(gain);
      return gain;
    }

    createBiquadFilter() {
      const filter = createFilter();
      filters.push(filter);
      return filter;
    }

    createBuffer(channels, length, rate) {
      const data = [new Float32Array(Math.floor(length))];
      const buffer = {
        channels,
        length,
        sampleRate: rate,
        getChannelData: (index) => data[index],
      };
      buffers.push(buffer);
      return buffer;
    }

    createBufferSource() {
      const source = createBufferSource();
      sources.push(source);
      return source;
    }
  }

  return { MockAudioContext, oscillators, gains, filters, sources, buffers };
}

describe('SoundEngine', () => {
  it('starts enabled by default', () => {
    const sound = new SoundEngine({ AudioContext: class {} });
    expect(sound.enabled).toBe(true);
  });

  it('accepts enabled: false', () => {
    const sound = new SoundEngine({ enabled: false, AudioContext: class {} });
    expect(sound.enabled).toBe(false);
  });

  it('toggle flips enabled and returns the new value', () => {
    const sound = new SoundEngine({ AudioContext: class {} });
    expect(sound.toggle()).toBe(false);
    expect(sound.enabled).toBe(false);
    expect(sound.toggle()).toBe(true);
    expect(sound.enabled).toBe(true);
  });

  it('play methods do nothing while disabled', () => {
    const ctor = vi.fn();
    const sound = new SoundEngine({ enabled: false, AudioContext: ctor });
    sound.playAddOperation();
    sound.playDustAnnihilation();
    sound.playLevelWin();
    expect(ctor).not.toHaveBeenCalled();
  });

  it('playAddOperation builds a rising sine blip', () => {
    const mock = createMockAudioContext();
    const sound = new SoundEngine({ AudioContext: mock.MockAudioContext });
    sound.playAddOperation();

    expect(mock.oscillators).toHaveLength(1);
    expect(mock.oscillators[0].type).toBe('sine');
    expect(mock.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(320, 10);
    expect(mock.oscillators[0].frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      640,
      10.12
    );
    expect(mock.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.2, 10);
    expect(mock.oscillators[0].start).toHaveBeenCalledWith(10);
    expect(mock.oscillators[0].stop).toHaveBeenCalledWith(10.15);
  });

  it('playDustAnnihilation builds noise plus a triangle chime', () => {
    const mock = createMockAudioContext();
    const sound = new SoundEngine({ AudioContext: mock.MockAudioContext });
    sound.playDustAnnihilation();

    expect(mock.buffers).toHaveLength(1);
    expect(mock.sources).toHaveLength(1);
    expect(mock.filters[0].type).toBe('bandpass');
    expect(mock.filters[0].frequency.setValueAtTime).toHaveBeenCalledWith(900, 10);
    expect(mock.oscillators[0].type).toBe('triangle');
    expect(mock.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(987.77, 10);
    expect(mock.sources[0].start).toHaveBeenCalledWith(10);
    expect(mock.oscillators[0].start).toHaveBeenCalledWith(10);
  });

  it('playLevelWin plays four triangle notes', () => {
    const mock = createMockAudioContext();
    const sound = new SoundEngine({ AudioContext: mock.MockAudioContext });
    sound.playLevelWin();

    expect(mock.oscillators).toHaveLength(4);
    expect(mock.oscillators.every((osc) => osc.type === 'triangle')).toBe(true);
    expect(mock.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 10);
    expect(mock.oscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(1046.5, 10.27);
  });

  it('reuses the same audio context after the first init', () => {
    const mock = createMockAudioContext();
    const sound = new SoundEngine({ AudioContext: mock.MockAudioContext });
    sound.playAddOperation();
    const firstCtx = sound.ctx;
    sound.playAddOperation();
    expect(sound.ctx).toBe(firstCtx);
  });
});
