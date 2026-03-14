const test = require('node:test');
const assert = require('node:assert/strict');

const { workspace } = require('../src/data/seed');
const {
  inferModeFromPrompt,
  inferSlideCount,
  clampVariants,
  buildImageRequirements,
  planSlides,
  planContentVariants
} = require('../src/services/ai-planner');
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

test('clampVariants keeps variants in [1..3]', () => {
  assert.equal(clampVariants(0), 1);
  assert.equal(clampVariants(2), 2);
  assert.equal(clampVariants(8), 3);
});

test('planSlides creates valid payload for carousel', () => {
  const planned = planSlides(workspace, 'Crea un carosello LinkedIn di 5 slide per spiegare la fiducia nel brand');
  assert.equal(planned.contentMode, 'carousel');
  assert.equal(planned.numberOfSlides, 5);
  assert.equal(planned.slides.length, 5);
  assert.equal(planned.slides[1].imageRequirements.hero.kind, 'brief');

  const validation = validateGeneratedContent(workspace, planned);
  assert.deepEqual(validation, { ok: true });
});

test('buildImageRequirements creates one requirement per image slot', () => {
  const template = workspace.templates.find((item) => item.id === 'template_explainer_01');
  const requirements = buildImageRequirements(template, 'solution', 'Parla di differenziazione del brand');

  assert.equal(requirements.hero.kind, 'brief');
  assert.match(requirements.hero.prompt, /differenziazione del brand/i);
});

test('planContentVariants returns multiple variants', () => {
  const planned = planContentVariants(workspace, 'Crea un carosello di 5 slide', 3);
  assert.equal(planned.variants.length, 3);
  assert.equal(planned.selectedVariant, 0);
  assert.equal(planned.numberOfSlides, 5);
});
