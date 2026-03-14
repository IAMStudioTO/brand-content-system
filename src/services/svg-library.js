const SVG_CATEGORIES = new Set(['background', 'decorative', 'accent', 'frame']);

function addSvgAsset(workspace, asset) {
  if (!asset?.id || !asset?.name || !asset?.category) {
    return { ok: false, code: '400_SVG_PAYLOAD_INVALID' };
  }
  if (!SVG_CATEGORIES.has(asset.category)) {
    return { ok: false, code: '422_SVG_CATEGORY_INVALID' };
  }

  const next = {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    compatibleSlots: asset.compatibleSlots || [],
    compatibleTemplates: asset.compatibleTemplates || [],
    isActive: asset.isActive !== false
  };

  const idx = workspace.svgAssets.findIndex((a) => a.id === asset.id);
  if (idx >= 0) workspace.svgAssets[idx] = next;
  else workspace.svgAssets.push(next);

  return { ok: true, asset: next };
}

function setSvgAssetActivation(workspace, assetId, isActive) {
  const asset = workspace.svgAssets.find((a) => a.id === assetId);
  if (!asset) return { ok: false, code: '404_ASSET_NOT_FOUND' };
  asset.isActive = Boolean(isActive);
  return { ok: true, asset };
}

module.exports = { addSvgAsset, setSvgAssetActivation };
