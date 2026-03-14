const http = require('http');
const { workspace } = require('./data/seed');
const { planContentVariants } = require('./services/ai-planner');
const { validateGeneratedContent } = require('./services/validator');
const { toRenderPayload } = require('./services/renderer');
const { generateId } = require('./services/id');
const { syncTemplate } = require('./services/template-sync');
const { addSvgAsset, setSvgAssetActivation } = require('./services/svg-library');

const state = {
  contents: new Map(),
  exports: new Map()
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
  if (!content) {
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

async function handler(req, res) {
  const requestUrl = parseRequestUrl(req);
  const path = requestUrl.pathname;

  if (req.method === 'GET' && path === '/api/v1/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && path === '/api/v1/admin/workspaces/ws_acme') {
    return sendJson(res, 200, workspace);
  }

  if (req.method === 'POST' && path === '/api/v1/admin/templates/sync') {
    try {
      const body = await parseBody(req);
      if (body.workspaceId !== workspace.id) {
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
      if (body.workspaceId !== workspace.id) {
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
    if (workspaceId !== workspace.id) {
      return sendJson(res, 404, { error: 'Workspace not found' });
    }
    return sendJson(res, 200, { assets: workspace.svgAssets });
  }

  if (req.method === 'POST' && path === '/api/v1/client/content/generate') {
    try {
      const body = await parseBody(req);
      if (!body.prompt || body.workspaceId !== workspace.id) {
        return sendJson(res, 400, { error: 'Invalid request body' });
      }

      const generated = planContentVariants(workspace, body.prompt, body.variants);
      for (const variant of generated.variants) {
        const validation = validateGeneratedContent(workspace, variant);
        if (!validation.ok) {
          return sendJson(res, 422, { error: validation.code });
        }
      }

      const contentId = generateId('cnt');
      const stored = {
        ...generated,
        workspaceId: workspace.id,
        createdAt: new Date().toISOString()
      };
      state.contents.set(contentId, stored);

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

  const previewMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/preview$/);
  if (req.method === 'GET' && previewMatch) {
    const content = getContentOr404(previewMatch[1], res);
    if (!content) return;
    const selected = content.variants[content.selectedVariant] || content.variants[0];
    return sendJson(res, 200, toRenderPayload(workspace, selected));
  }

  const exportMatch = path.match(/^\/api\/v1\/client\/content\/([^/]+)\/export$/);
  if (req.method === 'POST' && exportMatch) {
    const content = getContentOr404(exportMatch[1], res);
    if (!content) return;

    const exportId = generateId('exp');
    const downloadUrl = `/api/v1/client/exports/${exportId}.json`;
    state.exports.set(exportId, { content, downloadUrl });
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
