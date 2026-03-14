const http = require('http');
const { workspace: seedWorkspace } = require('./data/seed');
const { planContentVariants } = require('./services/ai-planner');
const { validateGeneratedContent } = require('./services/validator');
const { toRenderPayload } = require('./services/renderer');
const { generateId } = require('./services/id');
const { syncTemplate } = require('./services/template-sync');
const { addSvgAsset, setSvgAssetActivation } = require('./services/svg-library');

const state = {
  workspaces: new Map([[seedWorkspace.id, cloneDeep(seedWorkspace)]]),
  contents: new Map(),
  exports: new Map(),
  contentOrder: [],
  versions: new Map()
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseRequestUrl(req) {
  return new URL(req.url, 'http://localhost');
}

function getContentOr404(contentId, res) {
  const content = state.contents.get(contentId);
  if (!content || content.deletedAt) {
    sendJson(res, 404, { error: 'Not found' });
    return null;
  }
  return content;
}

function parseVariantIndex(input) {
  const index = Number.parseInt(input, 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return index;
}


function getWorkspace(workspaceId) {
  if (!workspaceId) return null;
  return state.workspaces.get(workspaceId) || null;
}

function getWorkspaceByContent(content) {
  return getWorkspace(content.workspaceId);
}

function cloneContent(content, nextId) {
  const cloned = cloneDeep(content);
  return {
    ...cloned,
    id: nextId,
    createdAt: new Date().toISOString()
  };
}




function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function getContentVersions(contentId) {
  if (!state.versions.has(contentId)) {
    state.versions.set(contentId, []);
  }
  return state.versions.get(contentId);
}

function applySvgUpdatesToVariant(variant, updates = []) {
  const next = JSON.parse(JSON.stringify(variant));

  for (const update of updates) {
    const slideIndex = Number.parseInt(update?.slideIndex, 10);
    if (!Number.isFinite(slideIndex) || slideIndex < 0 || slideIndex >= next.slides.length) {
      return { ok: false, code: '422_SLIDE_INDEX_INVALID' };
    }

    if (!update || typeof update.svgAssignments !== 'object' || Array.isArray(update.svgAssignments)) {
      return { ok: false, code: '400_SVG_UPDATES_INVALID' };
    }

    next.slides[slideIndex].svgAssignments = {
      ...next.slides[slideIndex].svgAssignments,
      ...update.svgAssignments
    };
  }

  return { ok: true, variant: next };
}

function applyTextUpdatesToVariant(variant, updates = []) {
  const next = JSON.parse(JSON.stringify(variant));

  for (const update of updates) {
    const slideIndex = Number.parseInt(update?.slideIndex, 10);
    if (!Number.isFinite(slideIndex) || slideIndex < 0 || slideIndex >= next.slides.length) {
      return { ok: false, code: '422_SLIDE_INDEX_INVALID' };
    }

    if (!update || typeof update.textAssignments !== 'object' || Array.isArray(update.textAssignments)) {
      return { ok: false, code: '400_TEXT_UPDATES_INVALID' };
    }

    next.slides[slideIndex].textAssignments = {
      ...next.slides[slideIndex].textAssignments,
      ...update.textAssignments
    };
  }

  return { ok: true, variant: next };
}

function applyImageUpdatesToVariant(variant, updates = []) {
  const next = JSON.parse(JSON.stringify(variant));

  for (const update of updates) {
    const slideIndex = Number.parseInt(update?.slideIndex, 10);
    if (!Number.isFinite(slideIndex) || slideIndex < 0 || slideIndex >= next.slides.length) {
      return { ok: false, code: '422_SLIDE_INDEX_INVALID' };
    }

    if (!update || typeof update.imageRequirements !== 'object' || Array.isArray(update.imageRequirements)) {
      return { ok: false, code: '400_IMAGE_UPDATES_INVALID' };
    }

    next.slides[slideIndex].imageRequirements = {
      ...next.slides[slideIndex].imageRequirements,
      ...update.imageRequirements
    };
  }

  return { ok: true, variant: next };
}

async function handler(req, res) {
  const requestUrl = parseRequestUrl(req);
  const path = requestUrl.pathname;

  if (req.method === 'GET' && path === '/api/v1/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && path === '/api/v1/admin/workspaces') {
    const items = Array.from(state.workspaces.values()).map((ws) => ({
      id: ws.id,
      brandId: ws.brandId,
      name: ws.name,
      format: ws.format,
      templatesCount: ws.templates.length,
      svgAssetsCount: ws.svgAssets.length
    }));
    return sendJson(res, 200, { items });
  }

  const getWorkspaceMatch = path.match(/^\/api\/v1\/admin\/workspaces\/([^/]+)$/);
  if (req.method === 'GET' && getWorkspaceMatch) {
    const workspace = getWorkspace(getWorkspaceMatch[1]);
    if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });
    return sendJson(res, 200, workspace);
  }


  const updateWorkspaceMatch = path.match(/^\/api\/v1\/admin\/workspaces\/([^/]+)$/);
  if (req.method === 'PATCH' && updateWorkspaceMatch) {
    try {
      const workspace = getWorkspace(updateWorkspaceMatch[1]);
      if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

      const body = await parseBody(req);
      const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
      const hasFormat = Object.prototype.hasOwnProperty.call(body, 'format');
      if (!hasName && !hasFormat) {
        return sendJson(res, 400, { error: '400_WORKSPACE_UPDATE_INVALID' });
      }

      if (hasName) {
        const name = String(body.name || '').trim();
        if (!name) return sendJson(res, 400, { error: '400_WORKSPACE_UPDATE_INVALID' });
        workspace.name = name;
      }

      if (hasFormat) {
        const format = String(body.format || '').trim();
        if (!format) return sendJson(res, 400, { error: '400_WORKSPACE_UPDATE_INVALID' });
        workspace.format = format;
      }

      return sendJson(res, 200, { workspace });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const deleteWorkspaceMatch = path.match(/^\/api\/v1\/admin\/workspaces\/([^/]+)$/);
  if (req.method === 'DELETE' && deleteWorkspaceMatch) {
    const workspaceId = deleteWorkspaceMatch[1];
    const workspace = getWorkspace(workspaceId);
    if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

    const hasContents = Array.from(state.contents.values()).some((content) => content.workspaceId === workspaceId);
    if (hasContents) {
      return sendJson(res, 409, { error: '409_WORKSPACE_HAS_CONTENTS' });
    }

    state.workspaces.delete(workspaceId);
    return sendJson(res, 200, { deleted: true, workspaceId });
  }

  if (req.method === 'POST' && path === '/api/v1/admin/workspaces') {
    try {
      const body = await parseBody(req);
      const id = String(body?.id || '').trim();
      const brandId = String(body?.brandId || '').trim();
      const name = String(body?.name || '').trim();
      const format = String(body?.format || 'linkedin-1080x1350').trim();

      if (!id || !brandId || !name) {
        return sendJson(res, 400, { error: '400_WORKSPACE_INVALID' });
      }
      if (state.workspaces.has(id)) {
        return sendJson(res, 409, { error: '409_WORKSPACE_ALREADY_EXISTS' });
      }

      const workspace = {
        id,
        brandId,
        name,
        format,
        templates: [],
        svgAssets: []
      };

      state.workspaces.set(id, workspace);
      return sendJson(res, 201, { workspace });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/api/v1/admin/templates/sync') {
    try {
      const body = await parseBody(req);
      const workspace = getWorkspace(body.workspaceId);
      if (!workspace) {
        return sendJson(res, 404, { error: 'Workspace not found' });
      }

      const result = syncTemplate(workspace, body);
      if (!result.ok) {
        const status = String(result.code).startsWith('400_') ? 400 : 422;
        return sendJson(res, status, { error: result.code });
      }

      return sendJson(res, 201, { template: result.template });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/api/v1/admin/svg-assets') {
    try {
      const body = await parseBody(req);
      const workspace = getWorkspace(body.workspaceId);
      if (!workspace) {
        return sendJson(res, 404, { error: 'Workspace not found' });
      }
      const result = addSvgAsset(workspace, body.asset);
      if (!result.ok) {
        const status = String(result.code).startsWith('400_') ? 400 : 422;
        return sendJson(res, status, { error: result.code });
      }
      return sendJson(res, 201, { asset: result.asset });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const activationMatch = path.match(/^\/api\/v1\/admin\/svg-assets\/([^/]+)\/activation$/);
  if (req.method === 'PATCH' && activationMatch) {
    try {
      const body = await parseBody(req);
      const workspaceId = requestUrl.searchParams.get('workspaceId') || body.workspaceId;
      const workspace = getWorkspace(workspaceId);
      if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

      const result = setSvgAssetActivation(workspace, activationMatch[1], body.isActive);
      if (!result.ok) {
        const status = result.code.startsWith('404_') ? 404 : 422;
        return sendJson(res, status, { error: result.code });
      }
      return sendJson(res, 200, { asset: result.asset });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === 'GET' && path === '/api/v1/admin/svg-assets') {
    const workspaceId = requestUrl.searchParams.get('workspaceId');
    const workspace = getWorkspace(workspaceId);
    if (!workspace) {
      return sendJson(res, 404, { error: 'Workspace not found' });
    }
    return sendJson(res, 200, { assets: workspace.svgAssets });
  }

  if (req.method === 'POST' && path === '/api/v1/client/content/generate') {
    try {
      const body = await parseBody(req);
      const workspaceId = String(body.workspaceId || '').trim();
      const prompt = String(body.prompt || '').trim();

      if (!workspaceId || !prompt) {
        return sendJson(res, 400, { error: '400_GENERATE_REQUEST_INVALID' });
      }

      const workspace = getWorkspace(workspaceId);
      if (!workspace) {
        return sendJson(res, 404, { error: 'Workspace not found' });
      }

      const generated = planContentVariants(workspace, prompt, body.variants);
      for (const variant of generated.variants) {
        const validation = validateGeneratedContent(workspace, variant);
        if (!validation.ok) {
          return sendJson(res, 422, { error: validation.code });
        }
      }

      const contentId = generateId('cnt');
      const stored = {
        id: contentId,
        ...generated,
        workspaceId: workspace.id,
        createdAt: new Date().toISOString()
      };
      state.contents.set(contentId, stored);
      state.contentOrder.unshift(contentId);

      return sendJson(res, 200, { contentId, ...stored });
    } catch (error) {
      return sendJson(res, 422, { error: error.message });
    }
  }

  const getContentMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)$/);
  if (req.method === 'GET' && getContentMatch) {
    const content = getContentOr404(getContentMatch[1], res);
    if (!content) return;
    return sendJson(res, 200, content);
  }

  if (req.method === 'GET' && path === '/api/v1/client/contents') {
    const workspaceId = requestUrl.searchParams.get('workspaceId');
    const workspace = getWorkspace(workspaceId);
    if (!workspace) {
      return sendJson(res, 404, { error: 'Workspace not found' });
    }

    const items = state.contentOrder
      .map((id) => state.contents.get(id))
      .filter((content) => content && !content.deletedAt && content.workspaceId === workspaceId)
      .map((content) => ({
        id: content.id,
        createdAt: content.createdAt,
        contentMode: content.contentMode,
        numberOfSlides: content.numberOfSlides,
        numberOfVariants: content.variants.length,
        selectedVariant: content.selectedVariant
      }));

    return sendJson(res, 200, { items });
  }

  const createVersionMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/versions$/);
  if (req.method === 'POST' && createVersionMatch) {
    try {
      const content = getContentOr404(createVersionMatch[1], res);
      if (!content) return;

      const body = await parseBody(req);
      const name = String(body?.name || '').trim();
      if (!name) {
        return sendJson(res, 400, { error: '400_VERSION_NAME_REQUIRED' });
      }

      const versions = getContentVersions(createVersionMatch[1]);
      const version = {
        id: generateId('ver'),
        name,
        createdAt: new Date().toISOString(),
        selectedVariant: content.selectedVariant,
        data: cloneDeep(content)
      };
      versions.unshift(version);

      return sendJson(res, 201, {
        versionId: version.id,
        name: version.name,
        createdAt: version.createdAt,
        selectedVariant: version.selectedVariant
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const listVersionsMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/versions$/);
  if (req.method === 'GET' && listVersionsMatch) {
    const content = getContentOr404(listVersionsMatch[1], res);
    if (!content) return;

    const versions = getContentVersions(listVersionsMatch[1]).map((v) => ({
      id: v.id,
      name: v.name,
      createdAt: v.createdAt,
      selectedVariant: v.selectedVariant
    }));

    return sendJson(res, 200, { items: versions });
  }

  const restoreVersionMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/versions\/([^/]+)\/restore$/);
  if (req.method === 'POST' && restoreVersionMatch) {
    const content = getContentOr404(restoreVersionMatch[1], res);
    if (!content) return;

    const versions = getContentVersions(restoreVersionMatch[1]);
    const version = versions.find((v) => v.id === restoreVersionMatch[2]);
    if (!version) {
      return sendJson(res, 404, { error: 'Version not found' });
    }

    const restored = cloneDeep(version.data);
    restored.id = content.id;
    restored.createdAt = content.createdAt;

    const workspace = getWorkspaceByContent(content);
    if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

    const validation = validateGeneratedContent(workspace, restored.variants[restored.selectedVariant] || restored.variants[0]);
    if (!validation.ok) {
      return sendJson(res, 422, { error: validation.code });
    }

    state.contents.set(restoreVersionMatch[1], restored);

    return sendJson(res, 200, {
      restored: true,
      versionId: version.id,
      selectedVariant: restored.selectedVariant
    });
  }

  const duplicateContentMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/duplicate$/);
  if (req.method === 'POST' && duplicateContentMatch) {
    const content = getContentOr404(duplicateContentMatch[1], res);
    if (!content) return;

    const duplicateId = generateId('cnt');
    const duplicated = cloneContent(content, duplicateId);
    state.contents.set(duplicateId, duplicated);
    state.contentOrder.unshift(duplicateId);

    return sendJson(res, 201, { contentId: duplicateId, ...duplicated });
  }

  const deleteContentMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)$/);
  if (req.method === 'DELETE' && deleteContentMatch) {
    const content = getContentOr404(deleteContentMatch[1], res);
    if (!content) return;

    content.deletedAt = new Date().toISOString();
    return sendJson(res, 200, { deleted: true, contentId: deleteContentMatch[1], deletedAt: content.deletedAt });
  }

  const restoreDeletedMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/restore$/);
  if (req.method === 'POST' && restoreDeletedMatch) {
    try {
      const content = state.contents.get(restoreDeletedMatch[1]);
      if (!content) return sendJson(res, 404, { error: 'Not found' });

      const body = await parseBody(req);
      const accessWorkspaceId = requestUrl.searchParams.get('workspaceId') || body.workspaceId;
      if (!ensureWorkspaceAccess(content, accessWorkspaceId, res)) return;

      if (!content.deletedAt) {
        return sendJson(res, 409, { error: '409_CONTENT_NOT_DELETED' });
      }

      content.deletedAt = null;
      return sendJson(res, 200, { restored: true, contentId: content.id });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const selectVariantMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/variant$/);
  if (req.method === 'PATCH' && selectVariantMatch) {
    try {
      const content = getContentOr404(selectVariantMatch[1], res);
      if (!content) return;

      const body = await parseBody(req);
      const variantIndex = parseVariantIndex(body.variantIndex);
      if (variantIndex === null) {
        return sendJson(res, 400, { error: 'Invalid variantIndex' });
      }
      if (variantIndex >= content.variants.length) {
        return sendJson(res, 422, { error: '422_VARIANT_INDEX_OUT_OF_RANGE' });
      }

      content.selectedVariant = variantIndex;
      return sendJson(res, 200, {
        selectedVariant: content.selectedVariant,
        numberOfVariants: content.variants.length
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const updateTextMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/text$/);
  if (req.method === 'PATCH' && updateTextMatch) {
    try {
      const content = getContentOr404(updateTextMatch[1], res);
      if (!content) return;

      const body = await parseBody(req);
      if (!Array.isArray(body.updates) || body.updates.length < 1) {
        return sendJson(res, 400, { error: '400_TEXT_UPDATES_INVALID' });
      }

      const selectedIndex = content.selectedVariant;
      const selected = content.variants[selectedIndex] || content.variants[0];
      const updated = applyTextUpdatesToVariant(selected, body.updates);
      if (!updated.ok) {
        const status = updated.code.startsWith('400_') ? 400 : 422;
        return sendJson(res, status, { error: updated.code });
      }

      const workspace = getWorkspaceByContent(content);
      if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

      const validation = validateGeneratedContent(workspace, updated.variant);
      if (!validation.ok) {
        return sendJson(res, 422, { error: validation.code });
      }

      content.variants[selectedIndex] = updated.variant;
      content.contentMode = updated.variant.contentMode;
      content.numberOfSlides = updated.variant.numberOfSlides;
      content.slides = updated.variant.slides;

      return sendJson(res, 200, {
        selectedVariant: selectedIndex,
        slides: content.variants[selectedIndex].slides
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const updateSvgMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/svg$/);
  if (req.method === 'PATCH' && updateSvgMatch) {
    try {
      const content = getContentOr404(updateSvgMatch[1], res);
      if (!content) return;

      const body = await parseBody(req);
      if (!Array.isArray(body.updates) || body.updates.length < 1) {
        return sendJson(res, 400, { error: '400_SVG_UPDATES_INVALID' });
      }

      const selectedIndex = content.selectedVariant;
      const selected = content.variants[selectedIndex] || content.variants[0];
      const updated = applySvgUpdatesToVariant(selected, body.updates);
      if (!updated.ok) {
        const status = updated.code.startsWith('400_') ? 400 : 422;
        return sendJson(res, status, { error: updated.code });
      }

      const workspace = getWorkspaceByContent(content);
      if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

      const validation = validateGeneratedContent(workspace, updated.variant);
      if (!validation.ok) {
        return sendJson(res, 422, { error: validation.code });
      }

      content.variants[selectedIndex] = updated.variant;
      content.contentMode = updated.variant.contentMode;
      content.numberOfSlides = updated.variant.numberOfSlides;
      content.slides = updated.variant.slides;

      return sendJson(res, 200, {
        selectedVariant: selectedIndex,
        slides: content.variants[selectedIndex].slides
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const updateImageMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/image$/);
  if (req.method === 'PATCH' && updateImageMatch) {
    try {
      const content = getContentOr404(updateImageMatch[1], res);
      if (!content) return;

      const body = await parseBody(req);
      if (!Array.isArray(body.updates) || body.updates.length < 1) {
        return sendJson(res, 400, { error: '400_IMAGE_UPDATES_INVALID' });
      }

      const selectedIndex = content.selectedVariant;
      const selected = content.variants[selectedIndex] || content.variants[0];
      const updated = applyImageUpdatesToVariant(selected, body.updates);
      if (!updated.ok) {
        const status = updated.code.startsWith('400_') ? 400 : 422;
        return sendJson(res, status, { error: updated.code });
      }

      const workspace = getWorkspaceByContent(content);
      if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });

      const validation = validateGeneratedContent(workspace, updated.variant);
      if (!validation.ok) {
        return sendJson(res, 422, { error: validation.code });
      }

      content.variants[selectedIndex] = updated.variant;
      content.contentMode = updated.variant.contentMode;
      content.numberOfSlides = updated.variant.numberOfSlides;
      content.slides = updated.variant.slides;

      return sendJson(res, 200, {
        selectedVariant: selectedIndex,
        slides: content.variants[selectedIndex].slides
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const previewMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/preview$/);
  if (req.method === 'GET' && previewMatch) {
    const content = getContentOr404(previewMatch[1], res);
    if (!content) return;
    const selected = content.variants[content.selectedVariant] || content.variants[0];
    const workspace = getWorkspaceByContent(content);
    if (!workspace) return sendJson(res, 404, { error: 'Workspace not found' });
    return sendJson(res, 200, toRenderPayload(workspace, selected));
  }

  const exportMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/export$/);
  if (req.method === 'POST' && exportMatch) {
    const content = getContentOr404(exportMatch[1], res);
    if (!content) return;

    const exportId = generateId('exp');
    const downloadUrl = `/api/v1/client/exports/${exportId}.json`;
    state.exports.set(exportId, { content: cloneDeep(content), downloadUrl });
    return sendJson(res, 201, { exportId, downloadUrl });
  }

  const fileMatch = path.match(/^\/api\/v1\/client\/exports\/([^/.]+)\.json$/);
  if (req.method === 'GET' && fileMatch) {
    const data = state.exports.get(fileMatch[1]);
    if (!data) return sendJson(res, 404, { error: 'Not found' });
    return sendJson(res, 200, data.content);
  }

  return sendJson(res, 404, { error: 'Not found' });
}

function startServer(port = 3000) {
  const server = http.createServer(handler);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Brand Content System API listening on http://localhost:${server.address().port}`);
  });
  return server;
}

if (require.main === module) {
  startServer(process.env.PORT ? Number(process.env.PORT) : 3000);
}

module.exports = { startServer, handler };
