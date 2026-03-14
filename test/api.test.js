const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startServer } = require('../src/server');

function requestJson({ method, port, path, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        method,
        hostname: '127.0.0.1',
        port,
        path,
        headers: payload
          ? {
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(payload)
            }
          : undefined
      },
      (res) => {
        let data = '';
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('API generate + get + variant-select + preview + export flow', async () => {
  const server = startServer(0);
  const port = server.address().port;

  try {
    const generation = await requestJson({
      method: 'POST',
      port,
      path: '/api/v1/client/content/generate',
      body: {
        workspaceId: 'ws_acme',
        prompt: 'Crea un carosello di 5 slide sul posizionamento',
        variants: 3
      }
    });

    assert.equal(generation.status, 200);
    assert.equal(generation.body.numberOfSlides, 5);
    assert.equal(generation.body.variants.length, 3);
    assert.ok(generation.body.contentId);

    const getContent = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}`
    });

    assert.equal(getContent.status, 200);
    assert.equal(getContent.body.variants.length, 3);

    const selectVariant = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/variant`,
      body: { variantIndex: 2 }
    });

    assert.equal(selectVariant.status, 200);
    assert.equal(selectVariant.body.selectedVariant, 2);

    const preview = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/preview`
    });

    assert.equal(preview.status, 200);
    assert.equal(preview.body.slides.length, 5);

    const exported = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/export`
    });

    assert.equal(exported.status, 201);
    assert.ok(exported.body.exportId);

    const exportedPayload = await requestJson({
      method: 'GET',
      port,
      path: exported.body.downloadUrl
    });

    assert.equal(exportedPayload.status, 200);
    assert.equal(exportedPayload.body.variants.length, 3);

    const invalidVariant = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/variant`,
      body: { variantIndex: 8 }
    });

    assert.equal(invalidVariant.status, 422);
    assert.equal(invalidVariant.body.error, '422_VARIANT_INDEX_OUT_OF_RANGE');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Admin template sync and svg asset lifecycle', async () => {
  const server = startServer(0);
  const port = server.address().port;

  try {
    const syncResult = await requestJson({
      method: 'POST',
      port,
      path: '/api/v1/admin/templates/sync',
      body: {
        workspaceId: 'ws_acme',
        template: {
          id: 'template_quote_01',
          name: 'Quote Template',
          width: 1080,
          height: 1350,
          roles: ['explanation'],
          layers: [
            { name: 'text/headline', type: 'text', rules: { maxChars: 50 } },
            {
              name: 'svg/background_main',
              type: 'svg',
              assetUrl: 'https://storage.example.com/bg.svg'
            }
          ]
        }
      }
    });

    assert.equal(syncResult.status, 201);
    assert.equal(syncResult.body.template.id, 'template_quote_01');

    const addAsset = await requestJson({
      method: 'POST',
      port,
      path: '/api/v1/admin/svg-assets',
      body: {
        workspaceId: 'ws_acme',
        asset: {
          id: 'svg_frame_01',
          name: 'Frame 01',
          category: 'frame',
          compatibleSlots: ['background_main'],
          compatibleTemplates: ['template_quote_01']
        }
      }
    });

    assert.equal(addAsset.status, 201);
    assert.equal(addAsset.body.asset.id, 'svg_frame_01');

    const deactivate = await requestJson({
      method: 'PATCH',
      port,
      path: '/api/v1/admin/svg-assets/svg_frame_01/activation',
      body: { isActive: false }
    });

    assert.equal(deactivate.status, 200);
    assert.equal(deactivate.body.asset.isActive, false);

    const listAssets = await requestJson({
      method: 'GET',
      port,
      path: '/api/v1/admin/svg-assets?workspaceId=ws_acme'
    });

    assert.equal(listAssets.status, 200);
    assert.ok(listAssets.body.assets.find((asset) => asset.id === 'svg_frame_01'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
