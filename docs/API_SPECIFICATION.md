# Brand Content System — API Specification (V1)

Base path: `/api/v1`
Auth: Bearer JWT (admin/client scopes)

## 1) Authentication
### POST `/auth/login`
Richiesta:
```json
{ "email": "admin@acme.com", "password": "***" }
```
Risposta 200:
```json
{ "accessToken": "jwt", "role": "admin", "expiresIn": 3600 }
```

## 2) Admin — Brands & Workspaces
### POST `/admin/brands`
Crea brand cliente.

### POST `/admin/workspaces`
Crea workspace associato a brand.

### GET `/admin/workspaces/:workspaceId`
Ritorna configurazione completa (brand pack, template, SVG attivi).

## 3) Admin — Template sync (Figma plugin)
### POST `/admin/templates/sync`
Payload minimo:
```json
{
  "workspaceId": "ws_acme",
  "template": {
    "id": "template_cover_01",
    "name": "Cover Statement",
    "format": "linkedin-1080x1350",
    "width": 1080,
    "height": 1350,
    "layers": [
      {
        "name": "text/headline",
        "type": "text",
        "x": 96,
        "y": 140,
        "width": 888,
        "height": 220,
        "zIndex": 10,
        "style": {
          "fontFamily": "Inter Tight",
          "fontSize": 72,
          "fontWeight": 700,
          "lineHeight": 1.05,
          "textAlign": "left",
          "color": "#111111"
        },
        "rules": { "maxChars": 70 }
      },
      {
        "name": "svg/background_main",
        "type": "svg",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1350,
        "zIndex": 1,
        "assetUrl": "https://storage/.../template_cover_01/background_main.svg"
      }
    ]
  }
}
```

Regole:
- layer names devono essere semantici
- `type=svg` deve includere `assetUrl`

## 4) Admin — SVG asset library
### POST `/admin/svg-assets`
Carica asset SVG con metadati compatibilità.

### PATCH `/admin/svg-assets/:assetId/activation`
Abilita/disabilita asset.

### GET `/admin/svg-assets?workspaceId=...`
Lista asset con stato, categoria, compatibilità.

## 5) Client — Content generation
### POST `/client/content/generate`
Richiesta:
```json
{
  "workspaceId": "ws_acme",
  "prompt": "Crea un carosello LinkedIn di 5 slide su comunicazione incoerente e fiducia brand",
  "variants": 1
}
```

Risposta 200:
```json
{
  "contentId": "cnt_001",
  "contentMode": "carousel",
  "numberOfSlides": 5,
  "slides": [
    {
      "role": "cover",
      "templateId": "template_cover_01",
      "textAssignments": {
        "headline": "Comunicazione incoerente, fiducia fragile",
        "subtitle": "Perché il brand perde riconoscibilità"
      },
      "svgAssignments": {
        "background_main": "svg_bg_01",
        "decor_top_right": "svg_decor_03",
        "accent_bottom": "svg_accent_02"
      },
      "imageRequirements": [],
      "cta": false
    }
  ]
}
```

Errori business:
- `422_TEMPLATE_NOT_ALLOWED`
- `422_SLOT_ASSIGNMENT_INVALID`
- `422_SVG_INCOMPATIBLE`
- `422_TEXT_LIMIT_EXCEEDED`

## 6) Client — Lifecycle, editing, preview, export
### GET `/client/contents?workspaceId=...`
Lista contenuti generati (metadata sintetici: id, createdAt, mode, varianti, selectedVariant).

### GET `/client/content/:contentId`
Dettaglio contenuto completo con `variants[]`.

### PATCH `/client/content/:contentId/variant`
Seleziona variante attiva.

Request:
```json
{ "variantIndex": 1 }
```

Errori:
- `422_VARIANT_INDEX_OUT_OF_RANGE`

### PATCH `/client/content/:contentId/text`
Editing testo controllato sulla variante attiva.

Request:
```json
{
  "updates": [
    {
      "slideIndex": 0,
      "textAssignments": {
        "headline": "Nuova headline"
      }
    }
  ]
}
```

Errori:
- `400_TEXT_UPDATES_INVALID`
- `422_SLIDE_INDEX_INVALID`
- `422_TEXT_LIMIT_EXCEEDED`
- `422_SLOT_ASSIGNMENT_INVALID`

### PATCH `/client/content/:contentId/svg`
Editing SVG controllato sulla variante attiva.

Request:
```json
{
  "updates": [
    {
      "slideIndex": 0,
      "svgAssignments": {
        "accent_bottom": "svg_accent_02"
      }
    }
  ]
}
```

Errori:
- `400_SVG_UPDATES_INVALID`
- `422_SLIDE_INDEX_INVALID`
- `422_SLOT_ASSIGNMENT_INVALID`
- `422_SVG_INCOMPATIBLE`

### PATCH `/client/content/:contentId/image`
Editing controllato degli `imageRequirements` sulla variante attiva.

Request:
```json
{
  "updates": [
    {
      "slideIndex": 1,
      "imageRequirements": {
        "hero": {
          "kind": "brief",
          "prompt": "Ritratto ambientato del team marketing in ufficio",
          "focalPoint": "problem"
        }
      }
    }
  ]
}
```

Errori:
- `400_IMAGE_UPDATES_INVALID`
- `422_SLIDE_INDEX_INVALID`
- `422_SLOT_ASSIGNMENT_INVALID`
- `422_IMAGE_REQUIREMENT_INVALID`

### GET `/client/content/:contentId/preview`
Ritorna payload render-ready della variante attiva.

### POST `/client/content/:contentId/export`
Crea export e ritorna URL download.

### POST `/client/content/:contentId/duplicate`
Duplica contenuto con nuovo `contentId`.

### DELETE `/client/content/:contentId`
Elimina contenuto e relativo storico versioni.

### POST `/client/content/:contentId/versions`
Crea snapshot versione nominata.

Request:
```json
{ "name": "Versione dopo editing" }
```

Errori:
- `400_VERSION_NAME_REQUIRED`

### GET `/client/content/:contentId/versions`
Lista versioni salvate.

### POST `/client/content/:contentId/versions/:versionId/restore`
Ripristina una versione salvata sul contenuto corrente.

Errori:
- `404 Version not found`

## 7) AI internal contract (server-side)
Il backend invia all’AI:
- brief utente
- lista template attivi
- slot + limiti
- asset SVG attivi + compatibilità
- tone of voice brand

Il backend accetta solo risposta JSON strict e valida via schema prima del salvataggio.

## 8) Status codes (convenzioni)
- `200` OK
- `201` Created
- `400` malformed request
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `422` semantic validation failed
- `500` internal error
