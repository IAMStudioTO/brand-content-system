# Design Tool — Documento tecnico-funzionale (V1)

Prodotto: **Brand Content System**
Versione: **V1**
Modello: **B2B Custom Premium**

## 1) Obiettivo
Questo documento definisce il comportamento del sistema da implementare per il MVP V1:

1. Plugin Figma (solo sync)
2. Web app (admin + client workspace)
3. Motore AI vincolato
4. Renderer visuale a composizione controllata

Il prodotto **non** è un editor grafico generalista. È un **Brand Content System** per aziende che vogliono produrre contenuti coerenti senza reparto creativo interno.

## 2) Visione prodotto
- Ogni cliente ha un workspace dedicato.
- I template sono progettati internamente dal designer/admin in Figma.
- Il cliente non disegna: fornisce un brief testuale all’AI.
- L’AI propone strutture e contenuti **entro vincoli definiti** (template/slot/regole).
- Output: singolo visual o carosello multi-slide, brand-consistent.

## 3) Unità di composizione
L’unità base è la **slide**:
- Single content = 1 slide
- Carousel/deck = N slide

Conseguenza: progettare **slide template modulari**, non “template carosello monolitici”.

## 4) Scope V1
### Incluso
- Formato primario: **LinkedIn vertical 1080x1350**
- Setup brand per 1+ clienti
- Fino a 5 template master per cliente
- Libreria SVG modulare per cliente
- Generazione AI: single + carousel
- Anteprima + export

### Escluso
- Editor libero tipo Canva
- Upload SVG da parte del cliente
- Drag&drop avanzato
- Multi-formato esteso
- Collaboration realtime
- Generazione design libera fuori vincoli

## 5) Regole fondanti
1. Solo 3 famiglie di elementi runtime:
   - `text`
   - `image`
   - `svg`
2. Tutta la grafica non testuale/non fotografica deve arrivare come SVG pronto.
3. L’AI non inventa layout: seleziona combinazioni valide.
4. Compatibilità tra slot/template/asset obbligatoria.

## 6) Figma design contract
Nei frame template Figma usare naming semantico obbligatorio:
- `text/...`
- `image/...`
- `svg/...`

Esempi:
- `text/headline`
- `text/subtitle`
- `image/hero`
- `svg/background_main`
- `svg/decor_top_right`

Naming non semantico (es. `Rectangle 51`) è invalido per la pipeline.

## 7) Fasi operative
1. **Setup cliente (admin/designer)**
   - Crea workspace cliente
   - Carica brand pack
   - Definisce template, slot e regole
   - Carica libreria SVG
2. **Sync da Figma**
   - Plugin legge frame selezionato
   - Esporta SVG
   - Invia metadati template+layer alla web app
3. **Uso cliente**
   - Inserisce prompt/brief
4. **Orchestrazione AI**
   - Classifica single vs carousel
   - Definisce narrativa slide-by-slide
   - Seleziona template + SVG compatibili
   - Compila testi entro limiti
5. **Render**
   - Composizione con coordinate e z-index
6. **Output**
   - 1+ varianti + export finale

## 8) Template model (V1)
Ogni template deve includere:
- Canvas (`width`, `height`, `format`)
- Text slots
- Image slots
- SVG slots
- Layer order / z-index
- Regole di compatibilità
- Limiti copy (es. max chars)

Target iniziale consigliato per cliente:
- max 5 template master

## 9) SVG system (V1)
### Categorie consigliate
- `background`
- `decorative`
- `accent`
- `frame`

### Metadati minimi SVG
- `category`
- `compatibleSlots[]`
- `compatibleTemplates[]`
- `weight` (light/medium/bold)
- `scaleMin` / `scaleMax`
- `typicalZIndex`
- `styleTag`

### Regola qualità asset
Gli SVG devono essere intercambiabili senza rompere layout:
- coerenza stile
- coerenza ingombri
- coerenza peso visivo

## 10) AI contract (output strutturato)
L’AI deve restituire **solo JSON** conforme a schema applicativo.

Campi obbligatori:
- `contentMode`: `single | carousel`
- `numberOfSlides`
- `slides[]`
  - `role`
  - `templateId`
  - `textAssignments`
  - `svgAssignments`
  - `imageRequirements`
  - `cta`

L’AI può usare esclusivamente template/slot/asset permessi nel workspace.

## 11) Esempio payload di slide generata
```json
{
  "role": "cover",
  "templateId": "template_cover_01",
  "textAssignments": {
    "headline": "Il tuo brand non è un logo",
    "subtitle": "È il sistema che rende riconoscibile ogni contenuto"
  },
  "svgAssignments": {
    "background_main": "svg_bg_01",
    "decor_top_right": "svg_decor_03",
    "accent_bottom": "svg_accent_02"
  },
  "imageRequirements": [],
  "cta": false
}
```

## 12) Outcome MVP
Validare la promessa:

> “Un’azienda senza reparto creativo può generare contenuti brandizzati coerenti parlando con un’AI, dentro un sistema visuale progettato da un designer.”
