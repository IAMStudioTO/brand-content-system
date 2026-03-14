# brand-content-system

B2B Premium Brand Content System — generazione contenuti AI-powered con integrazione Figma.

## Struttura del repository

```
brand-content-system/
├── apps/
│   └── web/                  # Web app client (Next.js 16 + React 19 + Tailwind 4 + TypeScript)
│       ├── src/
│       │   ├── app/          # App Router: layout, page, globals.css
│       │   └── lib/
│       │       └── api.ts    # Client HTTP verso il backend (generateContent, listContents)
│       ├── next.config.ts    # Rewrite /backend/* → http://127.0.0.1:3000/api/v1/*
│       └── package.json
├── docs/
│   ├── API_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── SPECIFICATION.md
├── src/                      # Backend Node.js (CommonJS, zero dipendenze esterne)
│   ├── data/
│   │   └── seed.js           # Workspace di default: ws_acme con template e SVG asset
│   ├── domain/
│   │   └── content-roles.js  # Ruoli carosello: cover, problem, consequence, solution, cta
│   ├── services/
│   │   ├── ai-planner.js     # Orchestratore deterministico: inferisce modalità, pianifica slide
│   │   ├── id.js             # Generatore ID con prefisso + timestamp + sequenza
│   │   ├── renderer.js       # Costruisce payload render-ready per il frontend
│   │   ├── svg-library.js    # Gestione asset SVG: aggiunta, attivazione/disattivazione
│   │   ├── svg-selector.js   # Selezione SVG compatibili per template e slot
│   │   ├── template-selector.js # Selezione template per ruolo slide
│   │   ├── template-sync.js  # Ingestion template dal plugin Figma con validazione layer
│   │   └── validator.js      # Validazione vincoli: slot, testi, SVG, immagini
│   ├── utils/
│   │   └── text.js           # trimToMaxChars con troncamento a carattere
│   └── server.js             # HTTP server (~730 righe): routing, state in-memory, handler
├── test/
│   ├── ai-planner.test.js    # Unit test orchestratore AI (6 test)
│   ├── api.test.js           # Integration test end-to-end (~900 righe, 5 suite)
│   ├── template-sync.test.js # Unit test validazione layer semantici (2 test)
│   └── validator.test.js     # Unit test validazione slide (4 test)
└── package.json              # Runner: node --test / node src/server.js
```

## Stato attuale

- **Backend MVP** Node.js completamente funzionante, stato in-memory (nessun DB)
- **Web app scaffold** Next.js avviata con UI base: form prompt + lista contenuti generati
- **18/18 test passano** ✅
- **Motore AI** deterministico, pronto per sostituzione con provider LLM reale

## Quickstart

### Backend

```bash
# Prerequisiti: Node.js 18+
npm test    # esegue 18 test
npm start   # avvia su http://localhost:3000
```

### Web app

```bash
cd apps/web
npm install
npm run dev   # avvia su http://localhost:3001 (o porta disponibile)
```

La web app fa rewrite automatico di `/backend/*` → `http://127.0.0.1:3000/api/v1/*` tramite `next.config.ts`. Il backend deve essere in esecuzione in parallelo.

## API — Endpoint disponibili

Base path: `/api/v1`

### Health
| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/health` | Verifica disponibilità server |

### Admin — Workspace
| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/admin/workspaces` | Lista workspace |
| `POST` | `/admin/workspaces` | Crea workspace (`id`, `brandId`, `name`, `format`) |
| `GET` | `/admin/workspaces/:workspaceId` | Dettaglio workspace completo |
| `PATCH` | `/admin/workspaces/:workspaceId` | Aggiorna `name` e/o `format` |
| `DELETE` | `/admin/workspaces/:workspaceId` | Elimina workspace (bloccato se ha contenuti: `409_WORKSPACE_HAS_CONTENTS`) |

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
| `GET` | `/client/contents?workspaceId=` | Lista contenuti (esclusi soft-deleted) |
| `GET` | `/client/content/:contentId` | Dettaglio contenuto con tutte le varianti |
| `PATCH` | `/client/content/:contentId/variant` | Seleziona variante attiva (`variantIndex`) |
| `PATCH` | `/client/content/:contentId/text` | Editing testo controllato sulla variante attiva |
| `PATCH` | `/client/content/:contentId/svg` | Editing SVG controllato sulla variante attiva |
| `PATCH` | `/client/content/:contentId/image` | Editing image requirements sulla variante attiva |
| `GET` | `/client/content/:contentId/preview` | Payload render-ready della variante attiva |
| `POST` | `/client/content/:contentId/duplicate` | Duplica contenuto con nuovo ID |
| `DELETE` | `/client/content/:contentId` | Soft-delete |
| `POST` | `/client/content/:contentId/restore` | Ripristina soft-delete (`409_CONTENT_NOT_DELETED` se non eliminato) |
| `POST` | `/client/content/:contentId/export` | Crea export JSON |
| `GET` | `/client/exports/:exportId.json` | Scarica export |
| `POST` | `/client/content/:contentId/versions` | Snapshot versione nominata |
| `GET` | `/client/content/:contentId/versions` | Lista versioni salvate |
| `POST` | `/client/content/:contentId/versions/:versionId/restore` | Ripristina versione salvata |

## Flusso implementato

1. L'AI planner inferisce modalità (`single` vs `carousel`) e numero slide dal testo del prompt
2. Per ogni slide seleziona il template compatibile con il ruolo (`cover`, `problem`, `consequence`, `solution`, `cta`)
3. Assegna gli SVG compatibili per template e slot (con rotazione per variante)
4. Genera i testi rispettando `maxChars` per ogni slot
5. Valida l'intero payload prima del salvataggio (template, slot, testi, SVG, immagini)
6. Il client può selezionare variante attiva, editare testi/SVG/immagini con ri-validazione
7. Preview render-ready, export JSON, snapshot versioni e restore disponibili

## Validazione layer Figma

I template sincronizzati dal plugin devono usare naming semantico obbligatorio:

| Prefisso | Tipo | Note |
|----------|------|-------|
| `text/` | Testo | Es. `text/headline`, `text/subtitle`, `text/body` |
| `image/` | Immagine | Es. `image/hero`, `image/avatar` |
| `svg/` | SVG | Es. `svg/background_main`, `svg/decor_top_right` — richiede `assetUrl` |

Naming non semantico (es. `Rectangle 51`) viene rifiutato con `422_LAYER_NAME_INVALID`.

## Codici di errore principali

| Codice | Significato |
|--------|-------------|
| `400_GENERATE_REQUEST_INVALID` | `workspaceId` o `prompt` mancanti/vuoti |
| `400_WORKSPACE_INVALID` | Payload creazione workspace non valido |
| `400_WORKSPACE_UPDATE_INVALID` | Nessun campo aggiornabile nel body |
| `400_TEXT_UPDATES_INVALID` | Array `updates` mancante o malformato |
| `400_SVG_UPDATES_INVALID` | Array `updates` mancante o malformato |
| `400_IMAGE_UPDATES_INVALID` | Array `updates` mancante o malformato |
| `400_VERSION_NAME_REQUIRED` | Nome versione mancante o vuoto |
| `409_WORKSPACE_ALREADY_EXISTS` | Workspace con stesso ID già presente |
| `409_WORKSPACE_HAS_CONTENTS` | Workspace con contenuti non eliminabile |
| `409_CONTENT_NOT_DELETED` | Restore su contenuto non soft-deleted |
| `422_VARIANT_INDEX_OUT_OF_RANGE` | Indice variante fuori range |
| `422_SLIDE_INDEX_INVALID` | Indice slide fuori range |
| `422_TEMPLATE_NOT_ALLOWED` | Template non esistente nel workspace |
| `422_SLOT_ASSIGNMENT_INVALID` | Slot non previsto dal template |
| `422_TEXT_LIMIT_EXCEEDED` | Testo supera `maxChars` del slot |
| `422_SVG_INCOMPATIBLE` | Asset SVG non compatibile con template/slot |
| `422_LAYER_NAME_INVALID` | Layer Figma con naming non semantico |
| `422_SVG_URL_REQUIRED` | Layer `svg/*` senza `assetUrl` |

## Web app (apps/web)

Stack: **Next.js 16 · React 19 · TypeScript · Tailwind CSS 4**

Funzionalità attuali:
- Form prompt con invio a `POST /client/content/generate`
- Lista contenuti generati dal workspace attivo (`ws_acme` hardcoded)
- Aggiornamento lista dopo generazione

Il proxy `next.config.ts` reindirizza tutte le chiamate `/backend/*` al backend locale su porta 3000, permettendo sviluppo frontend/backend in parallelo senza CORS.

## Seed di default

Al boot è disponibile il workspace `ws_acme` con:

- **2 template**: `template_cover_01` (ruoli: cover, cta) e `template_explainer_01` (ruoli: problem, consequence, solution, explanation)
- **3 SVG asset attivi**: `svg_bg_01` (background), `svg_decor_03` (decorative), `svg_accent_02` (accent)
- **Formato**: `linkedin-1080x1350`

## Note architetturali

- Stato completamente **in-memory**: nessun DB, nessun file system — si azzera al riavvio
- Il motore AI è **deterministico**: inferisce modalità e struttura dal testo del prompt senza chiamate LLM esterne; progettato per essere sostituito da OpenAI/Claude API
- Nessuna dipendenza esterna nel backend (puro Node.js stdlib)
- I test usano `node:test` nativo (Node.js 18+), nessun framework test

## Prossimi step

1. **Plugin Figma MVP** — sync reale frame/layer/SVG
2. **Persistenza** — Supabase/Postgres + object storage
3. **AI provider reale** — integrazione OpenAI o Claude API con output JSON rigoroso
4. **Web app admin/client** — interfaccia completa end-to-end
5. **Renderer visuale** — composizione slide su canvas frontend
