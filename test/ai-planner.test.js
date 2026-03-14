const test = require('node:test');
const assert = require('node:assert/strict');

const { workspace } = require('../src/data/seed');
const { inferModeFromPrompt, inferSlideCount, planSlides } = require('../src/services/ai-planner');
const { validateGeneratedContent } = require('../src/services/validator');

test('inferModeFromPrompt detects carousel keywords', () => {
  assert.equal(inferModeFromPrompt('Crea un carosello di 5 slide'), 'carousel');
  assert.equal(inferModeFromPrompt('Crea un post singolo'), 'single');
});

test('inferSlideCount extracts slide number with limits', () => {
  assert.equal(inferSlideCount('carosello 5 slide', 'carousel'), 5);
  assert.equal(inferSlideCount('carosello 80 slide', 'carousel'), 10);
  assert.equal(inferSlideCount('singolo', 'single'), 1);
});

test('planSlides creates valid payload for carousel', () => {
  const planned = planSlides(workspace, 'Crea un carosello LinkedIn di 5 slide per spiegare la fiducia nel brand');
  assert.equal(planned.contentMode, 'carousel');
  assert.equal(planned.numberOfSlides, 5);
  assert.equal(planned.slides.length, 5);

  const validation = validateGeneratedContent(workspace, planned);
  assert.deepEqual(validation, { ok: true });
});
