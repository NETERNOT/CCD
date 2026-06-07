# NovelGlyph
 
NovelGlyph generates a book cover, using an unique typographic system for any romance novel. Search for a book, let an AI analyse its narrative characteristics, then evolve custom assemic letterforms driven by those parameters — and export the result as a print-ready book cover PDF.
 
---
 
## How it works
 
1. **Search** — type a book title into the search field. Results are pulled live from the Open Library catalogue, filtered to the romance genre.
2. **Confirm** — select a book and confirm. The Gemini API analyses the book's title, description, and subject tags and returns four narrative parameters that will shape the glyphs.
3. **Evolve** — for each unique letter in the title, a population of five candidate glyphs is generated. Select the ones you prefer and evolve them iteratively. Finalize one glyph per letter when satisfied.
4. **Cover** — once all letters are finalized, a book cover is composed automatically: front cover with the title typeset in your glyphs, a back cover with an overlapping glyph pattern, and a spine with the title in a real, legible font.
5. **Export** — export the full five-panel cover (back flap, back, spine, front, front flap) as a single PDF.
---
 
## Narrative parameters
 
The Gemini API extracts four numeric values (0–1) from each book, which drive glyph generation:
 
| Parameter | Effect on glyphs |
|---|---|
| **Plot density** (`complexity`) | Controls the fragmentation of the glyph |
| **Amount of locations** (`openness`) | Controls the angular variation of the segments |
| **Text length** (`extensiveness`) | Controls stroke weight |
 
A genre string (`literary`, `historical`, `crime`, `experimental`, `genre`) drives the colour palette.
 
---
 
## Tech stack
 
| Layer | Library |
|---|---|
| Build | Vite |
| Vector drawing | Paper.js (one PaperScope per canvas) |
| Font rendering | opentype.js |
| Book search | Open Library API (public, no key required) |
| Parameter extraction | Google Gemini 2.5 Flash |
| PDF export | jsPDF + svg2pdf.js |
 
---
 
## Project structure
 
```
src/
  api/
    openLibrary.js     Search romance books via Open Library
    gemini.js          Extract narrative params via Gemini API
  bookcover/
    colors.js          Genre → colour palette
    composer.js        composeFront, composeBack, composeSpine
  typography/
    skeletons.json     36 base letterforms (A–Z, 0–9), normalised to 100×140
    genome.js          Evolution pipeline (crossover, mutation, selection)
    renderer.js        Genome → centered polylines array
  ui/
    canvasHelpers.js   setupCanvas, drawGlyph
    evoView.js         Population rows, parameter display, search dropdown
  state.js             Global app state
  main.js              Orchestration, event listeners, view switching
assets/
  fonts/               ESKlarheitGroteskMono (spine text)
```
 
---
 
## Setup
 
```bash
npm install
```
 
Create a `.env` file in the project root:
 
```
VITE_GEMINI_API_KEY=your_key_here
```
 
Get a free API key at [Google AI Studio](https://aistudio.google.com).

Finally, run:
 
```bash
npm run dev
```
And open the given link in your browser.

---
 
## Cover layout
 
The exported PDF is a single landscape page (441 × 210 mm) composed of five panels:
 
```
[ Front flap 70mm ][ Back cover 140mm ][ Spine 21mm ][ Front cover 140mm ][ Back flap 70mm ]
```
 
Only the back cover, spine, and front cover have rendered elements. Flap panels are strictly for functionality.
 
---
 
## Notes
 
- The evolution system is entirely client-side — no genomes are sent to any server.
- The Gemini free tier has rate limits, wich this project hits quite easily. If you hit one, the UI will display the retry delay returned by the API.
- The Gemini free tier has high demand, and may not be available at all times.