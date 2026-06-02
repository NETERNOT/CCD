import { setupCanvas, drawGlyph } from "./canvasHelpers.js";
import { createNewPopulation, evolvePopulation } from "../typography/genome.js"

export function createParameterItem(key, value) {
  const idx = value === 1 ? 4 : Math.floor(value * 5);

  const container = document.createElement("div");
  container.classList.add("parameter");
  const label = document.createElement("p");
  label.classList.add("title");
  label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
  const container2 = document.createElement("div");
  const low = document.createElement("span");
  low.textContent = "Low";
  const container3 = document.createElement("div");
  container3.classList.add("rating-container");

  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    if (i === idx) box.classList.add("selected");
    container3.appendChild(box);
  }
  const high = document.createElement("span");
  high.textContent = "High";

  container2.appendChild(low);
  container2.appendChild(container3);
  container2.appendChild(high);
  container.appendChild(label);
  container.appendChild(container2);

  return container;
}

export function createPopulationRow(char, row, params, checkAllFinalized) {
const populationMap = document.querySelector(".population-map");
  const container = document.createElement("div");
  container.classList.add("population-container");

  // ── Letter label ──
  const label = document.createElement("div");
  const charLabel = document.createElement("p");
  charLabel.textContent = char;
  label.appendChild(charLabel);
  container.appendChild(label);

  // ── Individual canvases ──
  // Append all canvases to DOM first, then setup + draw
  // so getBoundingClientRect() returns the correct size
  const canvasEls = [];
  for (let i = 0; i < row.population.length; i++) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    canvasEls.push(canvas);
    row.canvases.push(canvas);
  }

  // Controls (appended before finalized canvas, matching HTML structure)
  const controls = document.createElement("div");
  controls.classList.add("population-controls");

  const evolveBtn = document.createElement("button");
  const evolveIcon = document.createElement("img");
  const evolveTT = document.createElement("span");

  evolveIcon.src = "../rotate.svg";
  evolveTT.classList.add("tooltip");
  evolveTT.textContent =
    "Click to generate new set of designs. Selected designs will guide the direction of evolution.";
  evolveBtn.appendChild(evolveIcon);
  evolveBtn.appendChild(evolveTT);

  const finalizeBtn = document.createElement("button");
  const finalizeIcon = document.createElement("img");
  const finalizeTT = document.createElement("span");
  finalizeIcon.src = "../done.svg";
  finalizeTT.classList.add("tooltip");
  finalizeTT.textContent = "Once you are satisfied with the outcome, select your preferred option to create the final version."
  finalizeBtn.appendChild(finalizeIcon);
  finalizeBtn.appendChild(finalizeTT)
  finalizeBtn.disabled = true;

  controls.appendChild(evolveBtn);
  controls.appendChild(finalizeBtn);
  container.appendChild(controls);

  // ── Finalized canvas ──
  const finalizedCanvas = document.createElement("canvas");
  finalizedCanvas.classList.add("finalized-glyph");
  container.appendChild(finalizedCanvas);
  row.finalizedCanvas = finalizedCanvas;

  // ── Append row to DOM before reading sizes ──
  populationMap.appendChild(container);

  // ── Now safe to setup canvases (they're in DOM, sizes are correct) ──
  canvasEls.forEach((canvas, i) => {
    const scope = setupCanvas(canvas);
    row.scopes.push(scope);
    drawGlyph(scope, row.population[i], params);

    canvas.addEventListener("click", () => {
      if (row.finalized) return;

      const pos = row.selected.indexOf(i);
      if (pos === -1) {
        row.selected.push(i);
        canvas.classList.add("selected");
      } else {
        row.selected.splice(pos, 1);
        canvas.classList.remove("selected");
      }
      finalizeBtn.disabled = row.selected.length !== 1;
    });
  });

  // ── Setup finalized canvas after appending to DOM ──
  row.finalizedScope = setupCanvas(finalizedCanvas);

  // ── Evolve button ──
  evolveBtn.addEventListener("click", () => {
    const selectedGenomes = row.selected.map((idx) => row.population[idx]);

    if (selectedGenomes.length > 0) {
      row.population = evolvePopulation(
        row.population,
        selectedGenomes,
        params,
      );
    } else {
      row.population = createNewPopulation(char, params);
    }

    // Clear selection
    row.selected = [];
    row.canvases.forEach((c) => c.classList.remove("selected"));
    finalizeBtn.disabled = true;

    // Redraw all individuals
    row.population.forEach((genome, i) => {
      drawGlyph(row.scopes[i], genome, params);
    });
  });

  // ── Finalize button ──
  finalizeBtn.addEventListener("click", () => {
    if (row.finalized) {
      row.finalized = false;
      container.classList.remove("finalized");
      row.finalizedScope.project.clear();
      row.canvases.forEach((c) => c.classList.remove("finalized"));
      checkAllFinalized();
      finalizeBtn.disabled = true;
      finalizeIcon.src = "../done.svg";
      evolveBtn.disabled = false;
      return;
    }
    if (row.selected.length !== 1) return;

    const genome = row.population[row.selected[0]];
    drawGlyph(row.finalizedScope, genome, params);
    row.finalized = true;
    finalizeIcon.src = "../cancel.svg";
    evolveBtn.disabled = true;
    container.classList.add("finalized");

    row.selected.forEach((idx) => {
      row.canvases[idx].classList.toggle("selected", false);
    });
    row.selected = [];

    checkAllFinalized();
  });
}