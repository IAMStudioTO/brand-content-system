const { CAROUSEL_ROLES } = require('../domain/content-roles');
const { trimToMaxChars } = require('../utils/text');
const { selectTemplateForRole } = require('./template-selector');
const { assignSvgsForTemplate } = require('./svg-selector');

function inferModeFromPrompt(prompt) {
  const p = String(prompt || '').toLowerCase();
  if (p.includes('carosello') || p.includes('carousel') || p.includes('slide')) {
    return 'carousel';
  }
  return 'single';
}

function inferSlideCount(prompt, mode) {
  if (mode === 'single') return 1;
  const match = String(prompt || '').match(/(\d{1,2})\s*(slide|slides)/i);
  if (match) {
    const count = Number.parseInt(match[1], 10);
    return Math.max(2, Math.min(10, count));
  }
  return 5;
}

function clampVariants(variants) {
  const v = Number.parseInt(variants, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.min(3, Math.max(1, v));
}

function buildTextAssignments(template, role, prompt) {
  const text = {};
  Object.entries(template.textSlots).forEach(([slot, rules]) => {
    let value = '';
    if (slot === 'headline') {
      value = role === 'cover' ? `Tema: ${prompt}` : `${role.toUpperCase()}: punto chiave`;
    } else if (slot === 'subtitle') {
      value = 'Contenuto brandizzato coerente e orientato al business.';
    } else if (slot === 'body') {
      value = `Spiegazione sintetica per il ruolo ${role}, mantenendo tono professionale e orientato all'azione.`;
    } else {
      value = `${role} - ${slot}`;
    }
    text[slot] = trimToMaxChars(value, rules.maxChars);
  });
  return text;
}

function buildImageRequirements(template, role, prompt) {
  return (template.imageSlots || []).reduce((acc, slot) => {
    acc[slot] = {
      kind: 'brief',
      prompt: trimToMaxChars(
        `Immagine editoriale coerente con il tema "${prompt}" per la slide ${role}.`,
        160
      ),
      focalPoint: role
    };
    return acc;
  }, {});
}

function planSlides(workspace, prompt, variantIndex = 0) {
  const mode = inferModeFromPrompt(prompt);
  const numberOfSlides = inferSlideCount(prompt, mode);
  const roles = mode === 'single' ? ['cover'] : CAROUSEL_ROLES.slice(0, numberOfSlides);

  const slides = roles.map((role) => {
    const template = selectTemplateForRole(workspace, role);
    if (!template) {
      throw new Error(`No template available for role: ${role}`);
    }

    return {
      role,
      templateId: template.id,
      textAssignments: buildTextAssignments(template, role, prompt),
      svgAssignments: assignSvgsForTemplate(workspace, template, variantIndex),
      imageRequirements: buildImageRequirements(template, role, prompt),
      cta: role === 'cta'
    };
  });

  return {
    contentMode: mode,
    numberOfSlides: slides.length,
    slides
  };
}

function planContentVariants(workspace, prompt, variants) {
  const count = clampVariants(variants);
  const items = Array.from({ length: count }, (_, index) => planSlides(workspace, prompt, index));
  return {
    variants: items,
    selectedVariant: 0,
    ...items[0]
  };
}

module.exports = {
  inferModeFromPrompt,
  inferSlideCount,
  clampVariants,
  buildImageRequirements,
  planSlides,
  planContentVariants
};
