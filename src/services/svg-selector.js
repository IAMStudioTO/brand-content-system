function listCompatibleSvgs(workspace, templateId, slotName) {
  return workspace.svgAssets.filter(
    (asset) =>
      asset.isActive &&
      asset.compatibleTemplates.includes(templateId) &&
      asset.compatibleSlots.includes(slotName)
  );
}

function pickSvgForSlot(workspace, templateId, slotName, variantIndex = 0) {
  const candidates = listCompatibleSvgs(workspace, templateId, slotName);
  if (candidates.length === 0) return null;
  return candidates[variantIndex % candidates.length];
}

function assignSvgsForTemplate(workspace, template, variantIndex = 0) {
  return template.svgSlots.reduce((acc, slot) => {
    const asset = pickSvgForSlot(workspace, template.id, slot, variantIndex);
    if (asset) {
      acc[slot] = asset.id;
    }
    return acc;
  }, {});
}

module.exports = { listCompatibleSvgs, pickSvgForSlot, assignSvgsForTemplate };
