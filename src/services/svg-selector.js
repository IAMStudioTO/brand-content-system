function pickSvgForSlot(workspace, templateId, slotName) {
  return (
    workspace.svgAssets.find(
      (asset) =>
        asset.isActive &&
        asset.compatibleTemplates.includes(templateId) &&
        asset.compatibleSlots.includes(slotName)
    ) || null
  );
}

function assignSvgsForTemplate(workspace, template) {
  return template.svgSlots.reduce((acc, slot) => {
    const asset = pickSvgForSlot(workspace, template.id, slot);
    if (asset) {
      acc[slot] = asset.id;
    }
    return acc;
  }, {});
}

module.exports = { pickSvgForSlot, assignSvgsForTemplate };
