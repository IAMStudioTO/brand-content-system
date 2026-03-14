# Design Tool — Documento tecnico-funzionale

**Prodotto:** Brand Content System  
**Versione:** V1  
**Modello:** B2B Custom Premium

## 0. Obiettivo del documento
Descrivere in modo completo architettura, funzionamento, limiti e specifiche operative di un sistema composto da:
- plugin Figma
- web app admin/client
- motore AI di generazione contenuti
- motore di composizione visuale basato su template e SVG modulari

Il documento è pensato per uno sviluppatore AI che dovrà progettare e implementare il sistema.

---

## 1. Visione del prodotto
Il prodotto non è un editor grafico generico.  
È un **Brand Content System** per aziende senza reparto creativo.

Principi:
- ogni azienda cliente ha un workspace dedicato
- per ogni cliente vengono preparati template visuali custom
- i template sono composti da layout + slot testuali + slot immagini + slot SVG
- esiste una libreria di SVG modulari intercambiabili
- il cliente non disegna manualmente
- il cliente descrive all’AI il contenuto da creare

L’AI:
- sceglie il template migliore
- seleziona gli SVG compatibili
- scrive i testi in base agli spazi disponibili
- genera uno o più output visivi coerenti con il brand

Il sistema deve essere cloud-first, gestibile online, orientato a un flusso B2B premium.

---

## 2. Modello di business
### 2.1 Tipo di prodotto
Non è un SaaS aperto al mercato consumer.
È un productized service B2B premium con:
- setup iniziale custom per cliente
- accesso continuativo alla web app
- utilizzo di template e asset dedicati
- generazione contenuti guidata da AI

### 2.2 Cliente ideale
Aziende/team che:
- non hanno reparto creativo interno
- devono produrre contenuti brandizzati con continuità
- non vogliono dipendere sempre da un designer
- cercano autonomia dentro un sistema controllato

### 2.3 Posizionamento
Da non presentare come:
- AI design tool
- alternativa Canva
- generatore di template

Da presentare come:
- Brand Content System
- Content Production System
- Brand Content Engine

---

## 3. Architettura generale del sistema
### 3.1 Figma
Usato internamente da designer/admin per creare i template master.

### 3.2 Plugin Figma
Legge i template da Figma e invia struttura/metadati alla web app.

### 3.3 Web app
Aree principali:
- dashboard admin
- workspace cliente

### 3.4 Motore AI
Interpreta il prompt e restituisce:
- struttura narrativa
- scelta template
- selezione SVG
- testi ottimizzati per slot

### 3.5 Renderer visuale
Monta il contenuto finale su canvas web.

---

## 4. Flusso operativo completo
### 4.1 Setup cliente
Admin/designer crea:
- workspace cliente
- libreria SVG dedicata
- massimo 5 template master (slide template)
- regole di composizione
- brand pack

### 4.2 Sincronizzazione da Figma
Plugin usato per:
- selezionare template
- inviare struttura, slot, asset e metadati alla web app

### 4.3 Utilizzo cliente
Il cliente entra nel workspace e scrive un prompt, es:
> “Crea un carosello LinkedIn di 5 slide per spiegare perché una comunicazione incoerente riduce la fiducia nel brand.”

### 4.4 Fase AI
L’AI:
- capisce se contenuto è singolo o multipagina
- sceglie struttura narrativa
- assegna template alle slide
- seleziona SVG compatibili
- scrive testi rispettando gli spazi

### 4.5 Fase di render
Composizione automatica del contenuto.

### 4.6 Output
Il cliente vede:
- una o più varianti
- anteprima finale
- export

---

## 5. Concetto chiave: unità di composizione
L’unità base non è il “post”: è la **slide**.

Questo abilita:
- contenuto singolo = 1 slide
- carosello = N slide

Conseguenza: i template vanno progettati come **slide templates**.

---

## 6. Tipologie di contenuto supportate
### 6.1 Contenuto singolo
Una sola slide.
Esempi:
- post statico
- visual singolo
- promo card
- insight card

### 6.2 Carosello / deck / sequenza slide
Più slide collegate da narrativa.
Ruoli tipici:
- cover
- problema
- spiegazione
- prova/esempio/dato
- CTA finale

---

## 7. Sistema template
### 7.1 Non usare template chiusi
Niente immagini statiche bloccate.
Ogni template deve essere composto da:
- struttura
- slot
- asset modulari intercambiabili

### 7.2 Template master per cliente
Massimo iniziale consigliato: 5 template master/slide type.
Esempi:
- cover statement
- split text/visual
- bullet explainer
- quote/highlight
- CTA finale

### 7.3 Ogni template contiene
- dimensione canvas
- slot testuali
- slot immagini
- slot SVG
- ordine livelli
- regole compatibilità
- limiti testo

---

## 8. Sistema SVG
### 8.1 Principio base
Nella web app esistono solo 3 famiglie di elementi:
- testi
- immagini
- SVG

### 8.2 Libreria SVG separata
La libreria SVG del cliente è modulare.
Categorie esempio:
- background
- decorative
- accent
- frame/container

### 8.3 SVG non liberi
Gli SVG sono intercambiabili solo entro regole.
Metadati minimi:
- categoria
- peso visivo
- slot compatibili
- template compatibili
- scala minima/massima
- z-index tipico
- stile

### 8.4 Asset set iniziale consigliato
- 5 background SVG
- 5 decorative SVG
- 5 accent SVG
- 3 frame/container SVG

Totale indicativo: ~18 asset.

### 8.5 Regola progettuale
Gli SVG devono essere scambiabili senza rompere il layout:
- coerenza stilistica
- coerenza di ingombro
- coerenza di peso visivo
- prevedibilità combinatoria

---

## 9. Regola fondamentale per Figma
I template Figma devono essere semantici.
Tipi logici layer ammessi:
- `text/...`
- `image/...`
- `svg/...`

### 9.1 Esempi naming
- `text/headline`
- `text/subtitle`
- `text/body`
- `text/cta`
- `image/hero`
- `image/avatar`
- `svg/background_main`
- `svg/decor_top_right`
- `svg/accent_bottom_left`

### 9.2 Regola
Naming casuale non ammesso, es:
- `Rectangle 51`
- `Group final final`
- `Shape copy`

---

## 10. Plugin Figma
### 10.1 Ruolo
Ponte tra Figma e web app. Non fa editing.

### 10.2 Deve fare
- leggere frame selezionato
- leggere struttura/layer/bounds
- identificare layer semantici
- esportare SVG
- inviare payload alla web app

### 10.3 Non deve fare
- generare layout
- fare AI
- costruire business logic
- sostituire la web app

### 10.4 Perché plugin e non REST API in V1
Per MVP basta il plugin.
Il nodo critico è il mapping corretto Figma → web app, non il trasporto dati.

---

## 11. Dati letti dal plugin
Per ogni template/frame:
- template id
- brand/client id
- nome template
- width/height canvas
- lista layer supportati
- x/y/width/height layer
- ordine livelli (z-index)
- visibilità
- tipo layer

### 11.1 Layer `text/*`
- nome slot
- contenuto iniziale
- posizione
- dimensioni
- font family
- font size
- font weight
- line height
- text align
- colore
- limiti testo (se definiti)

### 11.2 Layer `image/*`
- nome slot
- posizione
- dimensioni
- riferimento immagine (se presente)

### 11.3 Layer `svg/*`
Non ricostruire vettoriale astratto.
Esportare file SVG e inviare:
- nome
- posizione
- dimensioni
- url asset salvato
- categoria
- z-index
- template compatibili

---

## 12. Come evitare errori di rendering
### 12.1 Regola critica
La web app non deve “capire” il design Figma.
Deve solo:
- rendere testi
- rendere immagini
- inserire SVG pronti
- rispettare posizione + ordine livelli

### 12.2 Cause comuni errore
- traduzione Figma→HTML/CSS generica
- ricostruzione maschere/composizioni complesse in browser
- payload ambiguo o povero

### 12.3 Soluzione
Far arrivare tutta la grafica come SVG esportato.
Vantaggi: conserva opacità, maschere, forme complesse, pattern, decorazioni.

### 12.4 Regola semplice
Se deve restare identico al template, deve arrivare come SVG pronto.

---

## 13. Dashboard admin
### 13.1 Ruolo
Pannello interno per configurare clienti.

### 13.2 Struttura
Lista clienti; ogni cliente ha workspace con:
- brand pack
- template sincronizzati
- libreria SVG
- canvas/formati
- contenuti generati

### 13.3 Funzioni admin
- creare cliente/workspace
- caricare/visualizzare asset SVG
- associare template al cliente
- impostare regole e compatibilità
- vedere anteprime template
- attivare/disattivare asset
- gestire prompt di sistema AI per brand

---

## 14. Workspace cliente
### 14.1 Ruolo
Ambiente dove il cliente usa il sistema.

### 14.2 Cosa vede
Non un editor libero. Vede:
- workspace dedicato
- formati disponibili
- input conversazionale/brief form
- proposte generate
- export finale

### 14.3 Cosa fa
Scrive brief desiderato, es:
- “Crea un post singolo”
- “Crea un carosello di 5 slide”
- “Spiega un concetto”
- “Promuovi un servizio”
- “Crea una CTA finale”

### 14.4 Cosa non fa
- caricare SVG
- disegnare layout da zero
- gestire design system avanzati
- comporre manualmente in modo complesso

---

## 15. Motore AI
### 15.1 Ruolo
Non genera design da zero.
Opera entro i vincoli del sistema.

### 15.2 Input
Prompt naturale del cliente.

### 15.3 Output
Struttura dati con:
- tipo contenuto
- numero slide
- ruolo di ogni slide
- template scelto per slide
- testi per slot
- SVG compatibili
- eventuali immagini richieste
- CTA sì/no

### 15.4 Regola chiave
L’AI non può “mixare tutto”. Deve usare solo:
- template permessi
- slot definiti
- asset compatibili

### 15.5 Esempio logica carosello
Input: carosello LinkedIn 5 slide su comunicazione incoerente.
Output logico:
- slide 1: cover
- slide 2: problema
- slide 3: conseguenza
- slide 4: soluzione
- slide 5: CTA

Con per-slide: `templateId`, testi, `svg` scelti.

---

## 16. Regole di composizione
### 16.1 Sistema non generativo puro
È composizione controllata.

### 16.2 Ogni template deve avere
- slot testo
- slot SVG
- slot immagini
- regole compatibilità

### 16.3 Esempi regole
- T1: max 1 background + 1 decor + 1 accent
- T2: solo 1 primary shape
- certi accent solo in alto
- certi background solo con specifici template
- body text max X caratteri
- headline max Y caratteri

### 16.4 Effetto desiderato
L’AI non inventa design: sceglie combinazioni migliori entro regole.

---

## 17. Struttura dati consigliata
### 17.1 Brand
```json
{
  "id": "brand_acme",
  "name": "ACME Consulting",
  "palette": {
    "primary": "#111111",
    "secondary": "#F3F1EC",
    "accent": "#B88A44"
  },
  "fonts": {
    "heading": "Inter Tight",
    "body": "Inter"
  }
}
```

### 17.2 Template
```json
{
  "id": "template_cover_01",
  "brandId": "brand_acme",
  "name": "Cover Statement",
  "format": "linkedin-carousel",
  "width": 1080,
  "height": 1350,
  "textSlots": ["headline", "subtitle"],
  "imageSlots": [],
  "svgSlots": ["background_main", "decor_top_right", "accent_bottom"],
  "rules": {
    "headlineMaxChars": 70,
    "subtitleMaxChars": 120
  }
}
```

### 17.3 SVG asset
```json
{
  "id": "svg_bg_01",
  "brandId": "brand_acme",
  "name": "Background Wave 01",
  "category": "background",
  "url": "https://storage/.../svg_bg_01.svg",
  "compatibleSlots": ["background_main"],
  "compatibleTemplates": ["template_cover_01", "template_explainer_01"],
  "weight": "light"
}
```

### 17.4 Generated slide
```json
{
  "role": "cover",
  "templateId": "template_cover_01",
  "text": {
    "headline": "Il tuo brand non è un logo",
    "subtitle": "È il sistema che rende riconoscibile ogni contenuto"
  },
  "svgAssignments": {
    "background_main": "svg_bg_01",
    "decor_top_right": "svg_decor_03",
    "accent_bottom": "svg_accent_02"
  }
}
```

---

## 18. Formati supportati in V1
Per limitare complessità V1 supporta 1 formato principale:
- LinkedIn carousel / slide verticali 1080x1350

Motivazione:
- copre single + carousel
- alta utilità per target B2B
- coerenza con posizionamento

---

## 19. Funzionalità V1
### 19.1 Admin
- login admin
- creazione cliente/workspace
- sync template da plugin
- caricamento/gestione SVG
- gestione brand pack
- attivazione/disattivazione asset

### 19.2 Cliente
- login cliente
- accesso workspace dedicato
- form/prompt generazione contenuti
- generazione singolo
- generazione carosello
- anteprima
- export

### 19.3 AI
- classificazione richiesta (single vs carousel)
- outline narrativa carosello
- selezione template
- selezione SVG
- generazione copy

---

## 20. Limiti V1
Non includere:
- editor libero tipo Canva
- drag&drop completo
- creazione template da cliente
- upload SVG da cliente
- supporto multi-formato avanzato
- animazioni
- collaboration real-time
- generazione design libera
- enterprise RBAC complesso

---

## 21. Scelte tecniche consigliate
### 21.1 Frontend
- Next.js
- Tailwind
- renderer React canvas/layout

### 21.2 Backend
- Next.js API routes o backend separato leggero
- Supabase (DB + auth + storage)
- alternativa storage: Vercel Blob / S3 compatibile

### 21.3 AI
- OpenAI o Claude API
- risposta JSON strutturata
- prompting fortemente vincolato

### 21.4 Plugin Figma
- Figma Plugin API
- invio payload alla web app
- export SVG dal plugin

---

## 22. Strategia di rendering
### 22.1 Approccio corretto
Montare la slide con:
- testi a coordinate
- immagini a coordinate
- SVG a coordinate

### 22.2 Approccio da evitare
No conversione generica Figma→HTML/CSS pixel perfect universale.

### 22.3 Logica
Sistema controllato, non universale.

---

## 23. Processo di utilizzo consigliato
1. Designer crea template in Figma.
2. Plugin sincronizza template/asset in piattaforma.
3. Admin configura cliente:
   - palette
   - font
   - template attivi
   - SVG attivi
   - regole
4. Cliente entra nel workspace e genera contenuti.

---

## 24. Prompting AI consigliato
L’AI non deve rispondere in linguaggio libero.
Deve restituire JSON rigoroso con:
- `contentMode`
- `numberOfSlides`
- `slides[]`
  - `role`
  - `templateId`
  - text assignments
  - svg assignments
  - image requirements
  - CTA

---

## 25. Strategia single vs carousel
### 25.1 Single
- usa 1 slide template
- genera 1 visual

### 25.2 Carousel
- definisce narrativa
- assegna slide type + template
- genera testi e asset slide-by-slide

### 25.3 Nota importante
Non creare template carosello unici, ma slide template modulari.

---

## 26. Rischi principali
### 26.1 Troppa libertà composizione
Effetto: perdita coerenza.
Soluzione: regole compatibilità forti.

### 26.2 Troppi pochi template
Effetto: ripetitività.
Soluzione: template modulari + SVG intercambiabili.

### 26.3 Ricostruzione visuale fragile
Effetto: mismatch design.
Soluzione: grafica come SVG esportati.

### 26.4 AI troppo libera
Effetto: output incoerente.
Soluzione: JSON rigoroso + vincoli rigidi.

---

## 27. Roadmap consigliata
### V1
- 1 formato
- 1 brand pilota
- 5 slide template
- libreria SVG base
- generazione single + carousel
- export

### V1.1
- miglioramento UX cliente
- 3 varianti per richiesta
- storico contenuti

### V2
- più formati
- più controlli cliente
- versioning template
- analytics

---

## 28. Obiettivo MVP
Non costruire editor universale.
Costruire sistema che valida questa promessa:

> “Un’azienda senza reparto creativo può generare contenuti brandizzati coerenti parlando con un’AI, dentro un sistema visuale progettato da un designer.”

---

## 29. Brief finale sintetico per sviluppatore AI
Costruire un sistema B2B premium composto da:
1. plugin Figma
2. web app admin/client
3. motore AI
4. renderer slide

Logica:
- template creati in Figma
- plugin sincronizza template/asset
- workspace dedicato per cliente
- cliente chiede contenuto all’AI
- AI sceglie template, SVG, testi
- sistema renderizza risultato finale

Vincoli:
- niente editor libero
- niente upload SVG cliente
- solo admin carica asset
- elementi grafici come SVG
- solo testo/immagine non-SVG
- composizione controllata da regole
- niente ricostruzione grafica da zero in browser

---

## 30. Decisioni già prese
- modello B2B custom premium
- non large consumer
- solo admin carica SVG
- plugin Figma in V1 (REST API non necessaria)
- grafica basata su SVG modulari intercambiabili
- supporto single + carousel
- unità base = slide
- AI limitata da template/slot/regole
- cliente senza editor libero
