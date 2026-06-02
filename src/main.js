import { createNewPopulation, evolvePopulation } from "./typography/genome.js";
import { state } from "./state.js";
import { createParameterItem, createPopulationRow } from "./ui/evoView.js";

const app = document.getElementById("app");
import paper from "paper";
import { applyPalette, getSelectedGenreIndex } from "./bookcover/colors.js";

init();

function init() {



// ── Test data (replace with state when APIs are ready) ────────

const TEST_TITLE = "abcd";
const TEST_PARAMS = {
  complexity: 0,
  openness: .4,
  darkness: 0.1,
  extensiveness: 1,
  type: "vanilla",
};

const parameterContainer = document.getElementById("parameter-container");
Object.entries(TEST_PARAMS).forEach(([key, value]) => {
  if (typeof value === "number"){
    parameterContainer.appendChild(createParameterItem(key, value))
  }
})

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

const makeBtn = document.querySelector("#evolution-container > button");
makeBtn.addEventListener("click", ()=>{
  app.classList.remove("Evo-View");
  app.classList.add("Cover-View");
})

// ── All-finalized check ───────────────────────────────────────

function checkAllFinalized() {
  makeBtn.disabled = ![...rowRegistry.values()].every((row) => row.finalized);
}


// ── Render all rows ───────────────────────────────────────────

rowRegistry.forEach((row, char) => createPopulationRow(char, row, TEST_PARAMS, checkAllFinalized));

// ALTERAR ISTO DE SITIO ??
const app = document.getElementById("app");
const links = document.querySelectorAll("nav a");
const randomizeBtn = document.querySelector("#color-container .button_txt");
 
if (randomizeBtn) {
  randomizeBtn.addEventListener("click", () => {
    const idx = getSelectedGenreIndex();
    applyPalette(idx);
  });
}

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
