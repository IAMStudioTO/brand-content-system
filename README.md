# brand-content-system

B2B Premium Brand Content System — generazione contenuti AI-powered con integrazione Figma.

## Struttura del repository

```
brand-content-system/
├── apps/
│   └── web/                      # Web app client (Next.js 16 + React 19 + Tailwind 4 + TypeScript)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx    # Root layout (Geist font, metadata)
│       │   │   ├── page.tsx      # UI: form prompt + lista contenuti generati
│       │   │   └── globals.css   # Tailwind 4 + CSS variables dark/light
│       │   └── lib/
│       │       └── api.ts        # Client HTTP: generateContent, listContents
│       ├── next.config.ts        # Rewrite /backend/* → http://127.0.0.1:3000/api/v1/*
│       ├── postcss.config.mjs    # @tailwindcss/postcss
│       ├── eslint.config.mjs     # ESLint Next.js + TypeScript
│       ├── tsconfig.json         # TypeScript strict, paths @/*
│       └── package.json          # next 16.1.6, react 19.2.3, tailwindcss 4
├── docs/
│   ├── API_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── SPECIFICATION.md
├── src/                          # Backend Node.js (CommonJS, zero dipendenze esterne)
│   ├── data/
│   │   └── seed.js               # Workspace di default ws_acme con template e SVG asset
│   ├── domain/
│   │   └── content-roles.js      # Ruoli carosello: cover, problem, consequence, solution, cta
│   ├── services/
│   │   ├── ai-planner.js         # Orchestratore deterministico: inferisce modalità, pianifica slide
│   │   ├── id.js                 # Generatore ID: prefix + timestamp base36 + sequenza
│   │   ├── renderer.js           # Costruisce payload render-ready per il frontend
│   │   ├── svg-library.js        # Aggiunta e attivazione/disattivazione asset SVG
│   │   ├── svg-selector.js       # Selezione SVG compatibili per template e slot
│   │   ├── template-selector.js  # Selezione template per ruolo slide
│   │   ├── template-sync.js      # Ingestion template Figma con validazione layer semantici
│   │   └── validator.js          # Validazione vincoli: slot, testi, SVG, immagini
│   ├── utils/
│   │   └── text.js               # trimToMaxChars con troncamento e ellissi
│   └── server.js                 # HTTP server (~730 righe): routing, state in-memory, handler
├── test/
│   ├── ai-planner.test.js        # Unit test orchestratore AI (6 test)
│   ├── api.test.js               # Integration test end-to-end (~900 righe, 5 suite)
│   ├── template-sync.test.js     # Unit test validazione layer semantici (2 test)
│   └── validator.test.js         # Unit test validazione slide (4 test)
└── package.json                  # scripts: node --test / node src/server.js, engine node>=18
```

## Stato attuale

- **Backend MVP** Node.js completamente funzionante, stato in-memory (nessun DB)
- **Web app scaffold** Next.js con UI base: form prompt + lista contenuti generati
- **18/18 test passano** ✅
- **Motore AI** deterministico, pronto per sostituzione con provider LLM reale

## Quickstart

### Backend

```bash
# Prerequisiti: Node.js 18+
npm test    # esegue 18 test (node:test nativo, nessun framework)
npm start   # avvia su http://localhost:3000
```

### Web app

```bash
cd apps/web
npm install
npm run dev   # avvia su http://localhost:3001 (o porta disponibile)
```

La web app fa rewrite automatico di `/backend/*` → `http://127.0.0.1:3000/api/v1/*` via `next.config.ts`. Backend e web app devono girare in parallelo.

## API — Endpoint disponibili

Base path: `/api/v1`

### Health

| Metodo | Path | Risposta |
|--------|------|----------|
| `GET` | `/health` | `{ ok: true }` |

### Admin — Workspace

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/admin/workspaces` | Lista workspace (id, brandId, name, format, templatesCount, svgAssetsCount) |
| `POST` | `/admin/workspaces` | Crea workspace — body: `{ id, brandId, name, format? }` |
| `GET` | `/admin/workspaces/:workspaceId` | Dettaglio completo (templates + svgAssets inclusi) |
| `PATCH` | `/admin/workspaces/:workspaceId` | Aggiorna `name` e/o `format` |
| `DELETE` | `/admin/workspaces/:workspaceId` | Elimina workspace — bloccato se ha contenuti (`409_WORKSPACE_HAS_CONTENTS`) |

### Admin — Template & SVG

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/admin/templates/sync` | Sincronizza template da plugin Figma (valida naming layer semantici) |
| `POST` | `/admin/svg-assets` | Aggiunge asset SVG con metadati compatibilità |
| `PATCH` | `/admin/svg-assets/:assetId/activation` | Attiva/disattiva asset (`workspaceId` in body o query) |
| `GET` | `/admin/svg-assets?workspaceId=` | Lista asset SVG del workspace |

### Client — Generazione e lifecycle contenuti

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/client/content/generate` | Genera contenuto (`workspaceId`, `prompt`, `variants` 1–3) |
| `GET` | `/client/contents?workspaceId=` | Lista contenuti non eliminati, ordinata per recency |
| `GET` | `/client/content/:contentId` | Dettaglio con tutte le varianti |
| `PATCH` | `/client/content/:contentId/variant` | Seleziona variante attiva (`variantIndex`) |
| `PATCH` | `/client/content/:contentId/text` | Editing testo controllato sulla variante attiva |
| `PATCH` | `/client/content/:contentId/svg` | Editing SVG controllato sulla variante attiva |
| `PATCH` | `/client/content/:contentId/image` | Editing image requirements sulla variante attiva |
| `GET` | `/client/content/:contentId/preview` | Payload render-ready della variante attiva |
| `POST` | `/client/content/:contentId/duplicate` | Duplica contenuto con nuovo ID (finisce in testa alla lista) |
| `DELETE` | `/client/content/:contentId` | Soft-delete (rimuove da `contentOrder`, mantiene in `contents`) |
| `POST` | `/client/content/:contentId/restore` | Ripristina soft-delete — richiede `workspaceId` in body o query |
| `POST` | `/client/content/:contentId/export` | Crea snapshot export JSON, ritorna `{ exportId, downloadUrl }` |
| `GET` | `/client/exports/:exportId.json` | Scarica snapshot export (immutabile dopo la creazione) |
| `POST` | `/client/content/:contentId/versions` | Crea snapshot versione nominata (`{ name }`) |
| `GET` | `/client/content/:contentId/versions` | Lista versioni salvate (recenti prima) |
| `POST` | `/client/content/:contentId/versions/:versionId/restore` | Ripristina versione salvata sul contenuto corrente |

## Flusso implementato

1. L'AI planner inferisce modalità (`single` vs `carousel`) e numero slide dal testo del prompt
2. Per ogni slide seleziona il template compatibile con il ruolo (`cover`, `problem`, `consequence`, `solution`, `cta`)
3. Assegna gli SVG compatibili per template e slot (rotazione round-robin per variante)
4. Genera testi rispettando `maxChars` per ogni slot (troncamento con `…`)
5. Valida l'intero payload prima del salvataggio (template, slot, testi, SVG, immagini)
6. Il client può selezionare variante attiva, editare con ri-validazione a ogni PATCH
7. Preview render-ready, export JSON snapshot, versioni e restore disponibili
8. DELETE è soft: rimuove dalla lista ma mantiene i dati; restore reimmette in testa alla lista

## Validazione layer Figma

Il naming dei layer in un template sincronizzato è semantico e obbligatorio:

| Prefisso | Tipo | Regole aggiuntive |
|----------|------|-------------------|
| `text/` | Testo | Es. `text/headline`, `text/subtitle`, `text/body` |
| `image/` | Immagine | Es. `image/hero`, `image/avatar` |
| `svg/` | SVG | Es. `svg/background_main` — **obbligatorio** `assetUrl` |

Naming non semantico (es. `Rectangle 51`, `Group final final`) → `422_LAYER_NAME_INVALID`.

## Codici di errore

| Codice | HTTP | Significato |
|--------|------|-------------|
| `400_GENERATE_REQUEST_INVALID` | 400 | `workspaceId` o `prompt` mancanti/vuoti |
| `400_WORKSPACE_INVALID` | 400 | Payload creazione workspace non valido |
| `400_WORKSPACE_UPDATE_INVALID` | 400 | Nessun campo aggiornabile nel body |
| `400_TEMPLATE_PAYLOAD_INVALID` | 400 | Payload template mancante o malformato |
| `400_SVG_PAYLOAD_INVALID` | 400 | Payload SVG asset mancante o malformato |
| `400_TEXT_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_SVG_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_IMAGE_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_VERSION_NAME_REQUIRED` | 400 | Nome versione mancante o stringa vuota |
| `403_WORKSPACE_ACCESS_DENIED` | 403 | `workspaceId` non corrisponde al contenuto |
| `404_ASSET_NOT_FOUND` | 404 | Asset SVG non trovato nel workspace |
| `409_WORKSPACE_ALREADY_EXISTS` | 409 | Workspace con stesso ID già presente |
| `409_WORKSPACE_HAS_CONTENTS` | 409 | Workspace con contenuti non eliminabile |
| `409_CONTENT_NOT_DELETED` | 409 | Restore su contenuto non soft-deleted |
| `422_VARIANT_INDEX_OUT_OF_RANGE` | 422 | Indice variante fuori range |
| `422_SLIDE_INDEX_INVALID` | 422 | Indice slide fuori range |
| `422_TEMPLATE_NOT_ALLOWED` | 422 | Template non esistente nel workspace |
| `422_SLOT_ASSIGNMENT_INVALID` | 422 | Slot non previsto dal template |
| `422_TEXT_LIMIT_EXCEEDED` | 422 | Testo supera `maxChars` del slot |
| `422_SVG_INCOMPATIBLE` | 422 | Asset SVG non compatibile con template/slot o inattivo |
| `422_SVG_CATEGORY_INVALID` | 422 | Categoria SVG non valida (attese: background, decorative, accent, frame) |
| `422_LAYER_NAME_INVALID` | 422 | Layer Figma con naming non semantico |
| `422_SVG_URL_REQUIRED` | 422 | Layer `svg/*` senza `assetUrl` |
| `422_REQUIRED_TEXT_SLOT_MISSING` | 422 | Slot testo obbligatorio non assegnato |
| `422_REQUIRED_SVG_SLOT_MISSING` | 422 | Slot SVG obbligatorio non assegnato |
| `422_REQUIRED_IMAGE_SLOT_MISSING` | 422 | Slot immagine obbligatorio non assegnato |
| `422_IMAGE_REQUIREMENT_INVALID` | 422 | Image requirement malformato o prompt vuoto |

## Web app (apps/web)

Stack: **Next.js 16.1.6 · React 19.2.3 · TypeScript 5 · Tailwind CSS 4 · Geist font**

Funzionalità attuali (`src/app/page.tsx`):
- Form prompt con invio a `POST /client/content/generate` per workspace `ws_acme`
- Lista contenuti generati con refresh automatico post-generazione
- Stato di loading e gestione errori inline
- Dark mode via CSS variables

Client API (`src/lib/api.ts`): due funzioni esportate — `generateContent(workspaceId, prompt)` e `listContents(workspaceId)`, entrambe via `fetch` con base `/backend`.

Il proxy `next.config.ts` reindirizza `/backend/:path*` → `http://127.0.0.1:3000/api/v1/:path*`, permettendo sviluppo frontend/backend in parallelo senza CORS.

## Seed di default (ws_acme)

Al boot è disponibile il workspace `ws_acme` (brand `brand_acme`) con:

**Template:**
- `template_cover_01` — Cover Statement (1080×1350) · ruoli: `cover`, `cta` · slot testo: `headline` (70 char), `subtitle` (120 char) · slot SVG: `background_main`, `decor_top_right`, `accent_bottom`
- `template_explainer_01` — Explainer (1080×1350) · ruoli: `problem`, `consequence`, `solution`, `explanation` · slot testo: `headline` (80 char), `body` (240 char) · slot immagine: `hero` · slot SVG: `background_main`, `accent_bottom`

**SVG asset:**
- `svg_bg_01` — background · slot: `background_main` · entrambi i template
- `svg_decor_03` — decorative · slot: `decor_top_right` · solo `template_cover_01`
- `svg_accent_02` — accent · slot: `accent_bottom` · entrambi i template

## Note architetturali

- Stato completamente **in-memory**: si azzera al riavvio del processo
- **Delete** rimuove il contentId da `contentOrder` (sparisce dalla lista); i dati restano in `contents` per il restore
- **Restore** verifica il `workspaceId` (403 se non corrisponde) e reinserisce in testa a `contentOrder`
- Gli **export** sono snapshot immutabili: un export creato prima di un'ulteriore modifica non riflette le modifiche successive
- Il motore AI è **deterministico**: nessuna chiamata LLM esterna, progettato per essere sostituito
- Nessuna dipendenza esterna nel backend (solo Node.js stdlib)
- I test usano `node:test` nativo (Node.js 18+), nessun framework

## Prossimi step

1. **Plugin Figma MVP** — sync reale frame/layer/SVG
2. **Persistenza** — Supabase/Postgres + object storage
3. **AI provider reale** — integrazione OpenAI o Claude API con output JSON rigoroso
4. **Web app admin/client** — interfaccia completa end-to-end
5. **Renderer visuale** — composizione slide su canvas frontend
