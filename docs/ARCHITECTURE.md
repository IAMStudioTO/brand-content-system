# Brand Content System — Technical Architecture (V1)

## 1. System overview
Architettura cloud-first composta da 4 sottosistemi:

1. **Figma Plugin** (ingestion layer)
2. **Web App** (admin + client)
3. **AI Orchestrator** (content planning/composition)
4. **Slide Renderer** (deterministic visual assembly)

Obiettivo: composizione visuale controllata da regole, non design generation libera.

## 2. High-level component diagram
- **Admin** → Figma + Plugin → API `/templates/sync` + `/assets/svg/upload`
- **Client** → Workspace UI → API `/content/generate`
- **API** → DB (metadata), Storage (SVG/image), AI provider
- **Renderer** ← generated plan + template geometry + assets catalog

## 3. Bounded contexts
### 3.1 Template Ingestion
Responsabilità:
- leggere frame selezionato in Figma
- mappare layer semantici (`text/*`, `image/*`, `svg/*`)
- esportare SVG raw
- inviare payload tipizzato al backend

### 3.2 Workspace Configuration
Responsabilità:
- setup cliente/brand
- gestione asset attivi
- gestione regole compatibilità
- gestione prompt di sistema AI

### 3.3 AI Planning
Responsabilità:
- classificare richiesta (`single|carousel`)
- costruire outline narrativo
- selezionare template e asset compatibili
- generare copy entro vincoli slot

### 3.4 Rendering
Responsabilità:
- composizione su canvas con coordinate assolute
- rispetto z-index e visibility
- iniezione content assignments
- output preview/export

## 4. Core design principles
1. **Determinismo visuale**: niente ricostruzione HTML/CSS generica da Figma.
2. **Semantic layer contract**: naming layer come API di design.
3. **Strict compatibility graph**: AI limitata da regole hard.
4. **Tenant isolation**: dati e asset segregati per brand/workspace.

## 5. Data flow (end-to-end)
1. Designer prepara slide template in Figma.
2. Plugin estrae struttura e assets.
3. Backend salva template snapshot + SVG storage URL.
4. Cliente invia brief.
5. Orchestrator carica contesto workspace (template attivi, asset attivi, limiti testo).
6. AI restituisce JSON strutturato.
7. Validatore server applica policy e fallback.
8. Renderer compone anteprima e output.

## 6. Validation pipeline
### 6.1 Input validation
- auth tenant
- contenuto prompt non vuoto
- formato supportato (`linkedin-1080x1350` in V1)

### 6.2 AI response validation
- schema JSON valido
- template ID esistente/attivo
- slot assignment coerenti
- limiti caratteri rispettati
- compatibilità SVG-template-slot valida

### 6.3 Rendering validation
- tutti gli asset URL risolvibili
- coordinate dentro canvas bounds (o clipping gestito)
- font availability fallback-safe

## 7. Storage model
- **DB relazionale**: brands, workspaces, templates, slots, compatibilities, generated contents
- **Object storage**: file SVG, immagini
- **Audit log**: sync template, generate content, export

## 8. Security and tenancy
- Row-level isolation per `brand_id` / `workspace_id`
- Solo admin può sincronizzare template e caricare SVG
- Cliente con privilegi limitati a generazione e consultazione contenuti propri
- Signed URLs per accesso asset privati

## 9. Observability
Metriche minime V1:
- template sync success rate
- AI generation success/failure rate
- validation failure reasons
- rendering latency P50/P95
- export success rate

## 10. Deployment suggestion
- Next.js app (frontend + API routes) su runtime serverless/container
- Supabase (Postgres/Auth/Storage) o stack equivalente
- AI provider via server-side integration (no client-side API key)

## 11. Failure handling strategy
- Se AI propone template non valido: retry con feedback vincoli.
- Se asset SVG non disponibile: fallback su asset di categoria equivalente.
- Se testo supera limiti: compressione copy con prompt di riscrittura vincolata.
