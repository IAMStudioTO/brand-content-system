function getTemplate(workspace, templateId) {
  return workspace.templates.find((t) => t.id === templateId) || null;
}

function validateRequiredTextSlots(template, textAssignments = {}) {
  const requiredSlots = Object.keys(template.textSlots || {});
  for (const slot of requiredSlots) {
    if (!(slot in textAssignments)) {
      return { ok: false, code: '422_REQUIRED_TEXT_SLOT_MISSING' };
    }
  }
  return { ok: true };
}

function validateRequiredSvgSlots(template, svgAssignments = {}) {
  const requiredSlots = template.svgSlots || [];
  for (const slot of requiredSlots) {
    if (!(slot in svgAssignments)) {
      return { ok: false, code: '422_REQUIRED_SVG_SLOT_MISSING' };
    }
  }
  return { ok: true };
}

function validateSlide(workspace, slide) {
  const template = getTemplate(workspace, slide.templateId);
  if (!template) return { ok: false, code: '422_TEMPLATE_NOT_ALLOWED' };

  const textRequired = validateRequiredTextSlots(template, slide.textAssignments);
  if (!textRequired.ok) return textRequired;

  const svgRequired = validateRequiredSvgSlots(template, slide.svgAssignments);
  if (!svgRequired.ok) return svgRequired;

  for (const slot of Object.keys(slide.textAssignments || {})) {
    if (!template.textSlots[slot]) {
      return { ok: false, code: '422_SLOT_ASSIGNMENT_INVALID' };
    }

    const maxChars = template.textSlots[slot].maxChars;
    const value = String(slide.textAssignments[slot] || '');
    if (Number.isFinite(maxChars) && value.length > maxChars) {
      return { ok: false, code: '422_TEXT_LIMIT_EXCEEDED' };
    }
  }

  for (const [slot, assetId] of Object.entries(slide.svgAssignments || {})) {
    if (!template.svgSlots.includes(slot)) {
      return { ok: false, code: '422_SLOT_ASSIGNMENT_INVALID' };
    }

    const asset = workspace.svgAssets.find((a) => a.id === assetId && a.isActive);
    if (!asset) return { ok: false, code: '422_SVG_INCOMPATIBLE' };

    const compatible =
      asset.compatibleSlots.includes(slot) && asset.compatibleTemplates.includes(template.id);
    if (!compatible) return { ok: false, code: '422_SVG_INCOMPATIBLE' };
  }

  return { ok: true };
}

function validateGeneratedContent(workspace, payload) {
  if (!payload || !Array.isArray(payload.slides) || payload.slides.length < 1) {
    return { ok: false, code: '400_BAD_REQUEST' };
  }

  for (const slide of payload.slides) {
    const result = validateSlide(workspace, slide);
    if (!result.ok) return result;
  }

  return { ok: true };
}

module.exports = {
  validateSlide,
  validateGeneratedContent,
  validateRequiredTextSlots,
  validateRequiredSvgSlots
};
