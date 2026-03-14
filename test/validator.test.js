const test = require('node:test');
const assert = require('node:assert/strict');

const { workspace } = require('../src/data/seed');
const { validateSlide } = require('../src/services/validator');

test('validateSlide fails when required text slot is missing', () => {
  const slide = {
    role: 'cover',
    templateId: 'template_cover_01',
    textAssignments: { headline: 'Only headline' },
    svgAssignments: {
      background_main: 'svg_bg_01',
      decor_top_right: 'svg_decor_03',
      accent_bottom: 'svg_accent_02'
    }
  };

  const result = validateSlide(workspace, slide);
  assert.equal(result.ok, false);
  assert.equal(result.code, '422_REQUIRED_TEXT_SLOT_MISSING');
});

test('validateSlide fails when required svg slot is missing', () => {
  const slide = {
    role: 'cover',
    templateId: 'template_cover_01',
    textAssignments: {
      headline: 'Titolo',
      subtitle: 'Sottotitolo'
    },
    svgAssignments: {
      background_main: 'svg_bg_01',
      accent_bottom: 'svg_accent_02'
    }
  };

  const result = validateSlide(workspace, slide);
  assert.equal(result.ok, false);
  assert.equal(result.code, '422_REQUIRED_SVG_SLOT_MISSING');
});
