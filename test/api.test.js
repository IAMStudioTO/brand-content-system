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

test('API generate + get + list + variant-select + text/svg/image-edit + preview + export + versions + restore + duplicate + delete flow', async () => {
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

    const listBeforeDelete = await requestJson({
      method: 'GET',
      port,
      path: '/api/v1/client/contents?workspaceId=ws_acme'
    });

    assert.equal(listBeforeDelete.status, 200);
    assert.ok(Array.isArray(listBeforeDelete.body.items));
    assert.ok(listBeforeDelete.body.items.find((item) => item.id === generation.body.contentId));

    const selectVariant = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/variant`,
      body: { variantIndex: 2 }
    });

    assert.equal(selectVariant.status, 200);
    assert.equal(selectVariant.body.selectedVariant, 2);

    const textUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/text`,
      body: {
        updates: [
          {
            slideIndex: 0,
            textAssignments: {
              headline: 'Nuova headline variante 3'
            }
          }
        ]
      }
    });

    assert.equal(textUpdate.status, 200);
    assert.equal(textUpdate.body.selectedVariant, 2);

    const svgUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/svg`,
      body: {
        updates: [
          {
            slideIndex: 0,
            svgAssignments: {
              accent_bottom: 'svg_accent_02'
            }
          }
        ]
      }
    });

    assert.equal(svgUpdate.status, 200);

    const imageUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/image`,
      body: {
        updates: [
          {
            slideIndex: 1,
            imageRequirements: {
              hero: {
                kind: 'brief',
                prompt: 'Ritratto ambientato del team marketing in ufficio',
                focalPoint: 'problem'
              }
            }
          }
        ]
      }
    });

    assert.equal(imageUpdate.status, 200);

    const preview = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/preview`
    });

    assert.equal(preview.status, 200);
    assert.equal(preview.body.slides.length, 5);
    assert.equal(preview.body.slides[0].layers.text.headline, 'Nuova headline variante 3');
    assert.equal(
      preview.body.slides[1].layers.image.hero.prompt,
      'Ritratto ambientato del team marketing in ufficio'
    );

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

    const createdVersion = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions`,
      body: { name: 'Versione dopo editing' }
    });

    assert.equal(createdVersion.status, 201);
    assert.ok(createdVersion.body.versionId);

    const versions = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions`
    });

    assert.equal(versions.status, 200);
    assert.equal(versions.body.items.length, 1);
    assert.equal(versions.body.items[0].name, 'Versione dopo editing');

    const postVersionEdit = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/text`,
      body: {
        updates: [
          {
            slideIndex: 0,
            textAssignments: { headline: 'Titolo temporaneo da annullare' }
          }
        ]
      }
    });

    assert.equal(postVersionEdit.status, 200);

    const restoreVersion = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions/${versions.body.items[0].id}/restore`
    });

    assert.equal(restoreVersion.status, 200);
    assert.equal(restoreVersion.body.restored, true);

    const previewAfterRestore = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/preview`
    });

    assert.equal(previewAfterRestore.status, 200);
    assert.equal(previewAfterRestore.body.slides[0].layers.text.headline, 'Nuova headline variante 3');

    const invalidVersion = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions`,
      body: { name: '   ' }
    });

    assert.equal(invalidVersion.status, 400);
    assert.equal(invalidVersion.body.error, '400_VERSION_NAME_REQUIRED');

    const missingVersionRestore = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions/ver_missing/restore`
    });

    assert.equal(missingVersionRestore.status, 404);

    const invalidVariant = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/variant`,
      body: { variantIndex: 8 }
    });

    assert.equal(invalidVariant.status, 422);
    assert.equal(invalidVariant.body.error, '422_VARIANT_INDEX_OUT_OF_RANGE');

    const invalidTextUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/text`,
      body: {
        updates: [
          {
            slideIndex: 99,
            textAssignments: { headline: 'X' }
          }
        ]
      }
    });

    assert.equal(invalidTextUpdate.status, 422);
    assert.equal(invalidTextUpdate.body.error, '422_SLIDE_INDEX_INVALID');

    const invalidSvgUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/svg`,
      body: {
        updates: [
          {
            slideIndex: 0,
            svgAssignments: {
              unknown_slot: 'svg_bg_01'
            }
          }
        ]
      }
    });

    assert.equal(invalidSvgUpdate.status, 422);
    assert.equal(invalidSvgUpdate.body.error, '422_SLOT_ASSIGNMENT_INVALID');

    const invalidImageUpdate = await requestJson({
      method: 'PATCH',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/image`,
      body: {
        updates: [
          {
            slideIndex: 1,
            imageRequirements: {
              unknown_slot: {
                kind: 'brief',
                prompt: 'Immagine non valida'
              }
            }
          }
        ]
      }
    });

    assert.equal(invalidImageUpdate.status, 422);
    assert.equal(invalidImageUpdate.body.error, '422_SLOT_ASSIGNMENT_INVALID');

    const duplicated = await requestJson({
      method: 'POST',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/duplicate`
    });

    assert.equal(duplicated.status, 201);
    assert.ok(duplicated.body.contentId);
    assert.notEqual(duplicated.body.contentId, generation.body.contentId);

    const listAfterDuplicate = await requestJson({
      method: 'GET',
      port,
      path: '/api/v1/client/contents?workspaceId=ws_acme'
    });

    assert.equal(listAfterDuplicate.status, 200);
    assert.equal(listAfterDuplicate.body.items[0].id, duplicated.body.contentId);

    const deleted = await requestJson({
      method: 'DELETE',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}`
    });

    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.deleted, true);

    const getDeleted = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}`
    });

    assert.equal(getDeleted.status, 404);

    const versionsAfterDelete = await requestJson({
      method: 'GET',
      port,
      path: `/api/v1/client/content/${generation.body.contentId}/versions`
    });

    assert.equal(versionsAfterDelete.status, 404);
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
