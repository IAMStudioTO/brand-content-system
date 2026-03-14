function normalizeLayerType(name, type) {
  if (type) return type;
  if (name.startsWith('text/')) return 'text';
  if (name.startsWith('image/')) return 'image';
  if (name.startsWith('svg/')) return 'svg';
  return 'unknown';
}

function parseSlotName(layerName) {
  const parts = String(layerName).split('/');
  return parts[1] || layerName;
}

function validateSemanticLayer(layer) {
  const name = String(layer.name || '');
  if (!/^text\/|^image\/|^svg\//.test(name)) {
    return { ok: false, code: '422_LAYER_NAME_INVALID' };
  }

  const layerType = normalizeLayerType(name, layer.type);
  if (layerType === 'svg' && !layer.assetUrl) {
    return { ok: false, code: '422_SVG_URL_REQUIRED' };
  }

  return { ok: true, layerType };
}

function syncTemplate(workspace, payload) {
  const tpl = payload.template;
  if (!tpl || !Array.isArray(tpl.layers) || !tpl.id || !tpl.name) {
    return { ok: false, code: '400_TEMPLATE_PAYLOAD_INVALID' };
  }

  const textSlots = {};
  const imageSlots = [];
  const svgSlots = [];

  for (const layer of tpl.layers) {
    const layerValidation = validateSemanticLayer(layer);
    if (!layerValidation.ok) return layerValidation;

    const slot = parseSlotName(layer.name);
    if (layerValidation.layerType === 'text') {
      textSlots[slot] = { maxChars: layer.rules?.maxChars || null };
    }
    if (layerValidation.layerType === 'image') {
      imageSlots.push(slot);
    }
    if (layerValidation.layerType === 'svg') {
      svgSlots.push(slot);
    }
  }

  const existingIndex = workspace.templates.findIndex((t) => t.id === tpl.id);
  const nextTemplate = {
    id: tpl.id,
    name: tpl.name,
    width: tpl.width,
    height: tpl.height,
    textSlots,
    imageSlots,
    svgSlots,
    roles: tpl.roles || ['cover']
  };

  if (existingIndex >= 0) {
    workspace.templates[existingIndex] = nextTemplate;
  } else {
    workspace.templates.push(nextTemplate);
  }

  return { ok: true, template: nextTemplate };
}

module.exports = { syncTemplate, validateSemanticLayer };
