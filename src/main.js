import { createNewPopulation, evolvePopulation } from "./typography/genome.js";
import { buildPolylines } from "./typography/renderer.js";
import { state } from "./state.js";
import paper from "paper";

init();

function init() {



// ── Test data (replace with state when APIs are ready) ────────

const TEST_TITLE = "BABALULSGFIUG";
const TEST_PARAMS = {
  complexity: 1,
  openness: 1,
  darkness: 0.1,
  extensiveness: 1,
  type: "vanilla",
};

function createParameterItem(key, value) {
  const idx = value === 1 ? 4 : Math.floor(value * 5);

  const container = document.createElement("div");
  container.classList.add("parameter");
  const label = document.createElement("h5");
  label.classList.add("title");
  label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
  const container2 = document.createElement("div");
  const low = document.createElement("h6");
  low.textContent = "low";
  const container3 = document.createElement("div");
  container3.classList.add("rating-container");

  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    if (i === idx) box.classList.add("selected");
    container3.appendChild(box);
  }
  const high = document.createElement("h6");
  high.textContent = "high";

  container2.appendChild(low);
  container2.appendChild(container3);
  container2.appendChild(high);
  container.appendChild(label);
  container.appendChild(container2);

  return container;
}

const parameterContainer = document.getElementById("parameter-container");
parameterContainer.appendChild(
  createParameterItem("plot density", TEST_PARAMS.complexity),
);
parameterContainer.appendChild(
  createParameterItem("amount of locations", TEST_PARAMS.openness),
);
parameterContainer.appendChild(
  createParameterItem("emotional tone", TEST_PARAMS.darkness),
);
parameterContainer.appendChild(
  createParameterItem("textual length", TEST_PARAMS.extensiveness),
);

// ── Canvas helpers ────────────────────────────────────────────

function setupCanvas(canvas) {
  canvas.width = 250;
  canvas.height = 250;
  const scope = new paper.PaperScope();
  scope.setup(canvas);
  canvas.style.width = "";
  canvas.style.height = "";
  return scope;
}

function drawGlyph(scope, genome, params) {
  scope.activate();
  scope.project.clear();

  const polylines = buildPolylines(genome);
  const cx = scope.view.size.width / 2;
  const cy = scope.view.size.height / 2;
  const scale = scope.view.size.height / 260; // max height:250, + some padding

  polylines.forEach((poly) => {
    if (poly.length < 2) return;
    const path = new scope.Path({
      strokeColor: "#000",
      strokeWidth: params.extensiveness * 9 + 1,
      strokeCap: "round",
      strokeJoin: "round",
    });
    poly.forEach((pt) => {
      path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
    });
  });

  scope.view.update();
}

// ── Row registry ──────────────────────────────────────────────
// char → { population, selected, canvases, scopes,
//          finalizedCanvas, finalizedScope, finalized }

const rowRegistry = new Map();

const uniqueLetters = [
  ...new Set(TEST_TITLE.replace(/[^A-Z0-9]/gi, "").toUpperCase()),
];

uniqueLetters.forEach((char) => {
  rowRegistry.set(char, {
    population: createNewPopulation(char, TEST_PARAMS),
    selected: [],
    canvases: [],
    scopes: [],
    finalizedCanvas: null,
    finalizedScope: null,
    finalized: false,
  });
});

// ── DOM refs ──────────────────────────────────────────────────

const populationMap = document.querySelector(".population-map");
const makeBtn = document.querySelector("#evolution-container > button");

// ── Population row creation ───────────────────────────────────

function createPopulationRow(char, row) {
  const container = document.createElement("div");
  container.classList.add("population-container");

  // ── Letter label ──
  const label = document.createElement("div");
  const charLabel = document.createElement("h2");
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
  const evolveTT = document.createElement("h6");

  evolveIcon.src = "../rotate.svg";
  evolveTT.classList.add("tooltip");
  evolveTT.textContent =
    "Click to generate new set of designs. Selected designs will guide the direction of evolution.";
  evolveBtn.appendChild(evolveIcon);
  evolveBtn.appendChild(evolveTT);

  const finalizeBtn = document.createElement("button");
  const finalizeIcon = document.createElement("img");
  const finalizeTT = document.createElement("h6");
  finalizeIcon.src = "../done.svg";
  finalizeTT.classList.add("tooltip");
  finalizeTT.textContent = "Once you are satisfied with the outcome, select your preferred option to create the final version."
  finalizeBtn.appendChild(finalizeIcon);
  finalizeBtn.appendChild(finalizeTT);
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
    drawGlyph(scope, row.population[i], TEST_PARAMS);

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
        TEST_PARAMS,
      );
    } else {
      row.population = createNewPopulation(char, TEST_PARAMS);
    }

    // Clear selection
    row.selected = [];
    row.canvases.forEach((c) => c.classList.remove("selected"));
    finalizeBtn.disabled = true;

    // Redraw all individuals
    row.population.forEach((genome, i) => {
      drawGlyph(row.scopes[i], genome, TEST_PARAMS);
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
    drawGlyph(row.finalizedScope, genome, TEST_PARAMS);
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

// ── All-finalized check ───────────────────────────────────────

function checkAllFinalized() {
  const allDone = [...rowRegistry.values()].every((row) => row.finalized);
  makeBtn.disabled = !allDone;
}



// ALTERAR ISTO DE SITIO ??
const app = document.getElementById("app");
const links = document.querySelectorAll("nav a");

function setView(view) {
  app.classList.remove("Evo-View", "Abt-View", "Cover-View");
  app.classList.add(view);
}

links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    links.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");

    setView(link.dataset.view);
  });
});

makeBtn.addEventListener("click", () => {
  setView("Cover-View");
});

  setView("Evo-View");

  

// ── Render all rows ───────────────────────────────────────────

rowRegistry.forEach((row, char) => createPopulationRow(char, row));
}
