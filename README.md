# brand-content-system

B2B Premium Brand Content System - AI-powered content generation with Figma integration.

## Stato attuale
Repository con documentazione tecnica V1 + backend Node.js in-memory per prototipazione rapida.

## Backend MVP scaffold (Node.js)
Endpoint disponibili:

### Health
- `GET /api/v1/health`

### Admin
- `GET /api/v1/admin/workspaces/ws_acme`
- `POST /api/v1/admin/templates/sync`
- `POST /api/v1/admin/svg-assets`
- `PATCH /api/v1/admin/svg-assets/:assetId/activation`
- `GET /api/v1/admin/svg-assets?workspaceId=ws_acme`

### Client
- `POST /api/v1/client/content/generate`
- `GET /api/v1/client/content/:contentId/preview`
- `POST /api/v1/client/content/:contentId/export`
- `GET /api/v1/client/exports/:exportId.json`

Il flusso implementato include:
1. pianificazione contenuto (`single` vs `carousel`)
2. selezione template per ruolo slide
3. assegnazione SVG compatibili
4. validazione vincoli (template/slot/testo/SVG)
5. payload render-ready per preview
6. export JSON in-memory

## Quickstart
Prerequisiti: Node.js 18+

```bash
npm test
npm start
```

Server di default su `http://localhost:3000`.

## Note
- Lo stato è in-memory (nessun DB persistente in questa fase).
- Il motore AI è un orchestratore deterministico iniziale, pronto per essere sostituito da provider LLM in step successivi.
