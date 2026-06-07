import { setupCanvas, drawGlyph } from "./canvasHelpers.js";
import { createNewPopulation, evolvePopulation } from "../typography/genome.js";
import { state } from "../state.js";
import { searchBooks } from "../api/openLibrary.js";

export function createParameterItem(key, value) {
  let text;
  switch (key) {
    case "complexity": text = "Plot Density"; break;
    case "openness":   text = "Amount of Locations"; break;
    // case "darkness":   text = "Emotional Tone"; break;
    case "extensiveness": text = "Text Length"; break;
    default: text = key;
  }

  const idx = value === 1 ? 4 : Math.floor(value * 5);

  const container = document.createElement("div");
  container.classList.add("parameter");
  const label = document.createElement("h5");
  label.classList.add("title");
  label.textContent = text;
  const container2 = document.createElement("div");
  const low = document.createElement("h6");
  low.textContent = "Low";
  const container3 = document.createElement("div");
  container3.classList.add("rating-container");

  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    if (i === idx) box.classList.add("selected");
    container3.appendChild(box);
  }
  const high = document.createElement("h6");
  high.textContent = "High";

  container2.appendChild(low);
  container2.appendChild(container3);
  container2.appendChild(high);
  container.appendChild(label);
  container.appendChild(container2);

  return container;
}

export async function queryAndPopulate(query, dropdown, onSelect) {
  const results = await searchBooks(query);
  dropdown.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("div");
    empty.classList.add("dropdown-item", "no-results");
    empty.textContent = "No results";
    dropdown.appendChild(empty);
    return;
  }

  results.forEach((book) => {
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    item.textContent = `${book.title} — ${book.author}`;
    item.addEventListener("click", () => onSelect(book));
    dropdown.appendChild(item);
  });
}

export function createPopulationRow(char, row, params, checkAllFinalized) {
  const populationMap = document.querySelector(".population-map");
  const container = document.createElement("div");
  container.classList.add("population-container");

  const label = document.createElement("div");
  const charLabel = document.createElement("p");
  charLabel.textContent = char;
  label.appendChild(charLabel);
  container.appendChild(label);

  const canvasEls = [];
  for (let i = 0; i < row.population.length; i++) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    canvasEls.push(canvas);
    row.canvases.push(canvas);
  }

  const controls = document.createElement("div");
  controls.classList.add("population-controls");

  const evolveBtn = document.createElement("button");
  const evolveIcon = document.createElement("img");
  const evolveTT = document.createElement("span");
  evolveIcon.src = "../rotate.svg";
  evolveTT.classList.add("tooltip");
  evolveTT.textContent = "Click to generate new set of designs. Selected designs will guide the direction of evolution.";
  evolveBtn.appendChild(evolveIcon);
  evolveBtn.appendChild(evolveTT);

  const finalizeBtn = document.createElement("button");
  const finalizeIcon = document.createElement("img");
  const finalizeTT = document.createElement("span");
  finalizeIcon.src = "../done.svg";
  finalizeTT.classList.add("tooltip");
  finalizeTT.textContent = "Once you are satisfied with the outcome, select your preferred option to create the final version.";
  finalizeBtn.appendChild(finalizeIcon);
  finalizeBtn.appendChild(finalizeTT);
  finalizeBtn.disabled = true;

  controls.appendChild(evolveBtn);
  controls.appendChild(finalizeBtn);
  container.appendChild(controls);

  const finalizedCanvas = document.createElement("canvas");
  finalizedCanvas.classList.add("finalized-glyph");
  container.appendChild(finalizedCanvas);
  row.finalizedCanvas = finalizedCanvas;

  populationMap.appendChild(container);

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

  row.finalizedScope = setupCanvas(finalizedCanvas);

  evolveBtn.addEventListener("click", () => {
    const selectedGenomes = row.selected.map((idx) => row.population[idx]);
    if (selectedGenomes.length > 0) {
      row.population = evolvePopulation(row.population, selectedGenomes, params);
    } else {
      row.population = createNewPopulation(char, params);
    }
    row.selected = [];
    row.canvases.forEach((c) => c.classList.remove("selected"));
    finalizeBtn.disabled = true;
    row.population.forEach((genome, i) => drawGlyph(row.scopes[i], genome, params));
  });

  finalizeBtn.addEventListener("click", () => {
    if (row.finalized) {
      row.finalized = false;
      state.finalizedMap.delete(char);
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
    state.finalizedMap.set(char, genome);
    drawGlyph(row.finalizedScope, genome, params);
    row.finalized = true;
    finalizeIcon.src = "../cancel.svg";
    evolveBtn.disabled = true;
    container.classList.add("finalized");
    row.selected.forEach((idx) => row.canvases[idx].classList.toggle("selected", false));
    row.selected = [];
    checkAllFinalized();
  });
}