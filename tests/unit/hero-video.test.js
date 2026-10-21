import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseHeroVideo } from '../../src/lib/hero-video.js';

const base = { mp4: '/media/hero-desktop.mp4', webm: '', isDesktop: true, saveData: false, reducedMotion: false };

test('usa el video en escritorio con archivo configurado (RF-10)', () => {
  assert.equal(shouldUseHeroVideo(base), true);
  assert.equal(shouldUseHeroVideo({ ...base, mp4: '', webm: '/media/hero-desktop.webm' }), true);
});

test('no usa el video sin archivo, en móvil, con ahorro de datos o con movimiento reducido', () => {
  assert.equal(shouldUseHeroVideo({ ...base, mp4: '' }), false);
  assert.equal(shouldUseHeroVideo({ ...base, isDesktop: false }), false);
  assert.equal(shouldUseHeroVideo({ ...base, saveData: true }), false);
  assert.equal(shouldUseHeroVideo({ ...base, reducedMotion: true }), false);
});
