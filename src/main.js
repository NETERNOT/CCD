import { createNewPopulation, evolvePopulation } from "./typography/genome.js";
import { state } from "./state.js";
import { createParameterItem, createPopulationRow } from "./ui/evoView.js";
import paper from "paper";
import { applyPalette, getSelectedGenreIndex } from "./bookcover/colors.js";
import { composeCover, randomizeColors } from "./bookcover/composer.js";
import { setupCanvas } from "./ui/canvasHelpers.js";

const app = document.getElementById("app");
const TEST_TITLE = "HARRY POTTER"; /* HARRY POTTER AND THE PHILOSOFERS STONE */
const TEST_PARAMS = {
  complexity: 0.5,
  openness: 0.5,
  darkness: 0.1,
  extensiveness: 0.5,
  type: "historical", 
};

const parameterContainer = document.getElementById("parameter-container");
Object.entries(TEST_PARAMS).forEach(([key, value]) => {
  if (typeof value === "number") {
    parameterContainer.appendChild(createParameterItem(key, value));
  }
});

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
const links = document.querySelectorAll("nav a");
const randomizeBtn = document.querySelector("#color-container .button_txt");
const coverInfo = document.querySelectorAll("#color-container p");

// ── Cover View ────────────────────────────────────────────────

coverInfo[0].textContent = TEST_TITLE;
coverInfo[1].textContent = TEST_PARAMS.type;

const coverCanvases = document.querySelectorAll("#sections-container canvas");
let coverScopes = [];

coverCanvases.forEach((canvas, i) => {
    coverScopes.push(setupCanvas(canvas, i));
});

randomizeBtn.addEventListener("click", () =>
  randomizeColors(coverCanvases, coverScopes, TEST_PARAMS.type),
);

// ── All-finalized check ───────────────────────────────────────

async function checkAllFinalized() {
  const allFinalized = [...rowRegistry.values()].every((row) => row.finalized);
  makeBtn.disabled = !allFinalized;

  if (allFinalized) {
    await composeCover(
      coverCanvases,
      coverScopes,
      state.finalizedMap,
      TEST_PARAMS,
      TEST_TITLE,
    );
  }
}

// ── Render all rows ───────────────────────────────────────────

rowRegistry.forEach((row, char) =>
  createPopulationRow(char, row, TEST_PARAMS, checkAllFinalized),
);

// ── Navigation ────────────────────────────────────────────────

function setView(view) {
  app.classList.remove("Evo-View", "Abt-View", "Cover-View");
  app.classList.add(view);
}
window.setView = setView;
