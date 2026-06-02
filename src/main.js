import { createNewPopulation, evolvePopulation } from "./typography/genome.js";
import { state } from "./state.js";
import { createParameterItem, createPopulationRow } from "./ui/evoView.js";
import paper from "paper";
import { applyPalette, getSelectedGenreIndex } from "./bookcover/colors.js";
import { composeCover } from "./bookcover/composer.js";

const app = document.getElementById("app");
const TEST_TITLE = "B5 ASDG98237 LAISHD IUAHS UIU";
const TEST_PARAMS = {
  complexity: 0,
  openness: 0.4,
  darkness: 0.1,
  extensiveness: 0.5,
  type: "crime",
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

// ── All-finalized check ───────────────────────────────────────

function checkAllFinalized() {
  const allFinalized = [...rowRegistry.values()].every((row) => row.finalized);
  makeBtn.disabled = !allFinalized;

  if (allFinalized) composeCover(state.finalizedMap, TEST_PARAMS, TEST_TITLE);
  }


// ── Render all rows ───────────────────────────────────────────

rowRegistry.forEach((row, char) =>
  createPopulationRow(char, row, TEST_PARAMS, checkAllFinalized),
);

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
window.setView = setView;
