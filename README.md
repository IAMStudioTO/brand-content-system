# Brand Content System

B2B Premium Brand Content System — generazione contenuti AI-powered con integrazione Figma.

## Struttura del repository
```
brand-content-system/
├── apps/
│   ├── web/                          # Web app client (Next.js 16 + React 19 + Tailwind 4 + TypeScript)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # Root layout (Geist font, metadata)
│   │   │   │   ├── page.tsx          # Dashboard: form prompt + lista contenuti generati
│   │   │   │   ├── globals.css       # Tailwind 4 + CSS variables dark/light
│   │   │   │   └── content/[id]/
│   │   │   │       └── page.tsx      # Pagina dettaglio contenuto (slide, testi, SVG, image)
│   │   │   └── lib/
│   │   │       └── api.ts            # Client HTTP: generateContent, listContents, getContent
│   │   ├── next.config.ts            # Rewrite /backend/* → http://127.0.0.1:3000/api/v1/*
│   │   └── package.json              # next 16.1.6, react 19.2.3, tailwindcss 4
│   └── figma-plugin/                 # Plugin Figma — Template Sync MVP
│       ├── manifest.json             # Entrypoint plugin (dist/code.js + dist/ui.html)
│       ├── package.json
│       ├── tsconfig.json
│       ├── scripts/
│       │   └── bundle-ui.js          # Copia src/ui.html → dist/ui.html
│       ├── src/
│       │   ├── code.ts               # Main thread: Figma API + fetch verso backend
│       │   └── ui.html               # UI iframe: form configurazione + feedback
│       └── dist/                     # Output build (gitignored)
│           ├── code.js
│           └── ui.html
├── docs/
│   ├── API_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── SPECIFICATION.md
├── src/                              # Backend Node.js (CommonJS, zero dipendenze esterne)
│   ├── data/
│   │   └── seed.js                   # Workspace di default ws_acme con template e SVG asset
│   ├── domain/
│   │   └── content-roles.js          # Ruoli carosello: cover, problem, consequence, solution, cta
│   ├── services/
│   │   ├── ai-planner.js             # Orchestratore deterministico: inferisce modalità, pianifica slide
│   │   ├── id.js                     # Generatore ID: prefix + timestamp base36 + sequenza
│   │   ├── renderer.js               # Costruisce payload render-ready per il frontend
│   │   ├── svg-library.js            # Aggiunta e attivazione/disattivazione asset SVG
│   │   ├── svg-selector.js           # Selezione SVG compatibili per template e slot
│   │   ├── template-selector.js      # Selezione template per ruolo slide
│   │   ├── template-sync.js          # Ingestion template Figma con validazione layer semantici
│   │   └── validator.js              # Validazione vincoli: slot, testi, SVG, immagini
│   ├── utils/
│   │   └── text.js                   # trimToMaxChars con troncamento e ellissi
│   └── server.js                     # HTTP server (~730 righe): routing, state in-memory, handler
├── test/
│   ├── ai-planner.test.js            # Unit test orchestratore AI (6 test)
│   ├── api.test.js                   # Integration test end-to-end (~900 righe, 5 suite)
│   ├── template-sync.test.js         # Unit test validazione layer semantici (2 test)
│   └── validator.test.js             # Unit test validazione slide (4 test)
└── package.json                      # scripts: node --test / node src/server.js, engine node>=18
```

## Stato attuale

| Componente | Stato |
|---|---|
| Backend API Node.js | ✅ MVP completo, stato in-memory |
| Test suite | ✅ 18/18 passano |
| Web app Next.js | ✅ Dashboard + dettaglio contenuto |
| Plugin Figma | ✅ Template Sync MVP — scan frame + sync al backend |
| Motore AI | ⚙️ Deterministico, pronto per sostituzione con LLM reale |
| Persistenza | ❌ Solo in-memory, si azzera al riavvio |

## Quickstart

### Backend
```bash
npm test     # 18 test (node:test nativo, nessun framework)
npm start    # avvia su http://localhost:3000
```

### Web app
```bash
cd apps/web
npm install
npm run dev  # avvia su http://localhost:3001 (o porta disponibile)
```

La web app fa rewrite automatico di `/backend/*` → `http://127.0.0.1:3000/api/v1/*` via `next.config.ts`. Backend e web app devono girare in parallelo.

### Plugin Figma
```bash
cd apps/figma-plugin
npm install
npm run build   # compila src/code.ts → dist/code.js e copia src/ui.html → dist/ui.html
```

In Figma: **Plugins → Development → Import plugin from manifest** → seleziona `apps/figma-plugin/manifest.json`.

**Flusso plugin:**
1. Seleziona un Frame, Component o Instance in Figma
2. Clicca **Scansiona frame selezionato** — il plugin legge i layer semantici ed esporta gli SVG
3. Configura Template ID, ruoli slide, Workspace ID e Backend URL
4. Clicca **Sincronizza template** — invia a `POST /api/v1/admin/templates/sync`

**Naming layer obbligatorio** (layer non semantici vengono ignorati con warning):

| Prefisso | Tipo | Esempio |
|---|---|---|
| `text/` | Testo | `text/headline`, `text/subtitle`, `text/body` |
| `image/` | Immagine | `image/hero`, `image/avatar` |
| `svg/` | SVG | `svg/background_main`, `svg/accent_bottom` |

## API — Endpoint disponibili

Base path: `/api/v1`

### Health

| Metodo | Path | Risposta |
|---|---|---|
| `GET` | `/health` | `{ ok: true }` |

### Admin — Workspace

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/admin/workspaces` | Lista workspace |
| `POST` | `/admin/workspaces` | Crea workspace |
| `GET` | `/admin/workspaces/:workspaceId` | Dettaglio completo |
| `PATCH` | `/admin/workspaces/:workspaceId` | Aggiorna `name` e/o `format` |
| `DELETE` | `/admin/workspaces/:workspaceId` | Elimina (bloccato se ha contenuti) |

### Admin — Template & SVG

| Metodo | Path | Descrizione |
|---|---|---|
| `POST` | `/admin/templates/sync` | Sincronizza template da plugin Figma |
| `POST` | `/admin/svg-assets` | Aggiunge asset SVG |
| `PATCH` | `/admin/svg-assets/:assetId/activation` | Attiva/disattiva asset |
| `GET` | `/admin/svg-assets?workspaceId=` | Lista asset SVG del workspace |

### Client — Generazione e lifecycle contenuti

| Metodo | Path | Descrizione |
|---|---|---|
| `POST` | `/client/content/generate` | Genera contenuto |
| `GET` | `/client/contents?workspaceId=` | Lista contenuti |
| `GET` | `/client/content/:contentId` | Dettaglio con tutte le varianti |
| `PATCH` | `/client/content/:contentId/variant` | Seleziona variante attiva |
| `PATCH` | `/client/content/:contentId/text` | Editing testo sulla variante attiva |
| `PATCH` | `/client/content/:contentId/svg` | Editing SVG sulla variante attiva |
| `PATCH` | `/client/content/:contentId/image` | Editing image requirements |
| `GET` | `/client/content/:contentId/preview` | Payload render-ready |
| `POST` | `/client/content/:contentId/duplicate` | Duplica contenuto |
| `DELETE` | `/client/content/:contentId` | Soft-delete |
| `POST` | `/client/content/:contentId/restore` | Ripristina soft-delete |
| `POST` | `/client/content/:contentId/export` | Crea snapshot export JSON |
| `GET` | `/client/exports/:exportId.json` | Scarica snapshot export |
| `POST` | `/client/content/:contentId/versions` | Crea versione nominata |
| `GET` | `/client/content/:contentId/versions` | Lista versioni |
| `POST` | `/client/content/:contentId/versions/:versionId/restore` | Ripristina versione |

## Codici di errore

| Codice | HTTP | Significato |
|---|---|---|
| `400_GENERATE_REQUEST_INVALID` | 400 | `workspaceId` o `prompt` mancanti/vuoti |
| `400_WORKSPACE_INVALID` | 400 | Payload creazione workspace non valido |
| `400_WORKSPACE_UPDATE_INVALID` | 400 | Nessun campo aggiornabile nel body |
| `400_TEMPLATE_PAYLOAD_INVALID` | 400 | Payload template mancante o malformato |
| `400_SVG_PAYLOAD_INVALID` | 400 | Payload SVG asset mancante o malformato |
| `400_TEXT_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_SVG_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_IMAGE_UPDATES_INVALID` | 400 | Array `updates` mancante o vuoto |
| `400_VERSION_NAME_REQUIRED` | 400 | Nome versione mancante |
| `403_WORKSPACE_ACCESS_DENIED` | 403 | `workspaceId` non corrisponde al contenuto |
| `404_ASSET_NOT_FOUND` | 404 | Asset SVG non trovato |
| `409_WORKSPACE_ALREADY_EXISTS` | 409 | Workspace con stesso ID già presente |
| `409_WORKSPACE_HAS_CONTENTS` | 409 | Workspace con contenuti non eliminabile |
| `409_CONTENT_NOT_DELETED` | 409 | Restore su contenuto non soft-deleted |
| `422_VARIANT_INDEX_OUT_OF_RANGE` | 422 | Indice variante fuori range |
| `422_SLIDE_INDEX_INVALID` | 422 | Indice slide fuori range |
| `422_TEMPLATE_NOT_ALLOWED` | 422 | Template non esistente nel workspace |
| `422_SLOT_ASSIGNMENT_INVALID` | 422 | Slot non previsto dal template |
| `422_TEXT_LIMIT_EXCEEDED` | 422 | Testo supera `maxChars` del slot |
| `422_SVG_INCOMPATIBLE` | 422 | Asset SVG non compatibile o inattivo |
| `422_SVG_CATEGORY_INVALID` | 422 | Categoria SVG non valida |
| `422_LAYER_NAME_INVALID` | 422 | Layer Figma con naming non semantico |
| `422_SVG_URL_REQUIRED` | 422 | Layer `svg/*` senza `assetUrl` |
| `422_REQUIRED_TEXT_SLOT_MISSING` | 422 | Slot testo obbligatorio mancante |
| `422_REQUIRED_SVG_SLOT_MISSING` | 422 | Slot SVG obbligatorio mancante |
| `422_REQUIRED_IMAGE_SLOT_MISSING` | 422 | Slot immagine obbligatorio mancante |
| `422_IMAGE_REQUIREMENT_INVALID` | 422 | Image requirement malformato |

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
- Gli **export** sono snapshot immutabili
- Il motore AI è **deterministico**: nessuna chiamata LLM esterna, progettato per essere sostituito
- Nessuna dipendenza esterna nel backend (solo Node.js stdlib)
- I test usano `node:test` nativo (Node.js 18+)

## Prossimi step

1. **Persistenza** — Supabase/Postgres + object storage
2. **AI provider reale** — integrazione OpenAI o Claude API con output JSON rigoroso
3. **Web app admin** — gestione workspace, template, asset SVG
4. **Renderer visuale** — composizione slide su canvas frontend
5. **Multi-formato** — supporto formati oltre `linkedin-1080x1350`
