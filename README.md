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
- `POST /api/v1/client/content/generate` (supporto `variants` 1..3)
- `GET /api/v1/client/contents?workspaceId=ws_acme`
- `GET /api/v1/client/content/:contentId`
- `PATCH /api/v1/client/content/:contentId/variant` (selezione variante attiva)
- `PATCH /api/v1/client/content/:contentId/text` (editing testo controllato sulla variante attiva)
- `PATCH /api/v1/client/content/:contentId/svg` (editing SVG controllato sulla variante attiva)
- `GET /api/v1/client/content/:contentId/preview`
- `POST /api/v1/client/content/:contentId/duplicate`
- `DELETE /api/v1/client/content/:contentId`
- `POST /api/v1/client/content/:contentId/export`
- `GET /api/v1/client/exports/:exportId.json`
- `POST /api/v1/client/content/:contentId/versions` (snapshot versione)
- `GET /api/v1/client/content/:contentId/versions`

Il flusso implementato include:
1. pianificazione contenuto (`single` vs `carousel`)
2. selezione template per ruolo slide
3. assegnazione SVG compatibili
4. validazione vincoli (template/slot/testo/SVG)
5. editing testo controllato con validazione vincoli
6. editing SVG controllato con validazione vincoli
7. payload render-ready per preview
8. gestione varianti contenuto (fino a 3)
9. storico contenuti in-memory (list + duplicate + delete)
10. export JSON in-memory
11. snapshot versioni contenuto in-memory

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
