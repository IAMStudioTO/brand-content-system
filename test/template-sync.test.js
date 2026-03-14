const test = require('node:test');
const assert = require('node:assert/strict');

const { validateSemanticLayer } = require('../src/services/template-sync');

test('validateSemanticLayer rejects non-semantic names', () => {
  const result = validateSemanticLayer({ name: 'Rectangle 51', type: 'text' });
  assert.equal(result.ok, false);
  assert.equal(result.code, '422_LAYER_NAME_INVALID');
});

test('validateSemanticLayer requires assetUrl for svg layers', () => {
  const result = validateSemanticLayer({ name: 'svg/background_main', type: 'svg' });
  assert.equal(result.ok, false);
  assert.equal(result.code, '422_SVG_URL_REQUIRED');
});
