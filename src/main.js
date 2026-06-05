/* main.js */

import { createNewPopulation } from "./typography/genome.js";
import { state, setBook, resetState } from "./state.js";
import {
  createParameterItem,
  createPopulationRow,
  queryAndPopulate,
} from "./ui/evoView.js";
import { composeCover, randomizeColors } from "./bookcover/composer.js";
import { setupCanvas } from "./ui/canvasHelpers.js";
import { extractBookParams } from "./api/gemini.js";

// ── DOM refs ──────────────────────────────────────────────────

const app = document.getElementById("app");
const makeBtn = document.querySelector("#evolution-container > button");
const randomizeBtn = document.querySelector("#color-container .button_txt");
const coverInfo = document.querySelectorAll("#color-container p");
const searchInput = document.getElementById("search-input");
const confirmBtn = document.getElementById("confirm-book");
const dropdown = document.getElementById("dropdown");
const parameterContainer = document.getElementById("parameter-container");
const populationMap = document.querySelector(".population-map");

// ── Cover canvases (set up once) ──────────────────────────────

const coverCanvases = document.querySelectorAll("#sections-container canvas");
const coverScopes = [];
coverCanvases.forEach((canvas, i) => coverScopes.push(setupCanvas(canvas, i)));

randomizeBtn.addEventListener("click", () =>
  randomizeColors(coverCanvases, coverScopes, state.params?.type),
);

// ── Search ────────────────────────────────────────────────────

let stagedBook = null;
let rowRegistry = new Map();
let debounceTimer = null;

function onSelect(book) {
  stagedBook = book;
  searchInput.value = `${book.title} — ${book.author}`;
  dropdown.classList.remove("active");
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  stagedBook = null;
  const query = searchInput.value.trim();
  if (!query) {
    dropdown.classList.remove("active");
    return;
  }
  debounceTimer = setTimeout(() => {
    queryAndPopulate(query, dropdown, onSelect);
    dropdown.classList.add("active");
  }, 1000);
});

// ── Confirm ───────────────────────────────────────────────────

confirmBtn.addEventListener("click", async () => {
  if (stagedBook === null) return;
  resetState();
  setBook(stagedBook);

  state.params = {
    complexity: 0.5,
    openness: 0.5,
    darkness: 0.1,
    extensiveness: 0.5,
    type: "historical",
  };

  try {
    state.params = await extractBookParams(stagedBook);
  } catch (error) {
    console.error("Error extracting book parameters:", error);
    return;
  }
  // Clear previous evolution
  rowRegistry = new Map();
  populationMap.innerHTML = "";
  parameterContainer.innerHTML = "";
  makeBtn.disabled = true;

  // Populate parameter display
  Object.entries(state.params).forEach(([key, value]) => {
    if (typeof value === "number") {
      parameterContainer.appendChild(createParameterItem(key, value));
    }
  });

  // Build row registry from parsed title
  const uniqueLetters = [...new Set(state.title.replace(/[^A-Z0-9]/g, ""))];
  uniqueLetters.forEach((char) => {
    rowRegistry.set(char, {
      population: createNewPopulation(char, state.params),
      selected: [],
      canvases: [],
      scopes: [],
      finalizedCanvas: null,
      finalizedScope: null,
      finalized: false,
    });
  });

  rowRegistry.forEach((row, char) =>
    createPopulationRow(char, row, state.params, checkAllFinalized),
  );

  // Update cover info
  coverInfo[0].textContent = state.book.title;
  coverInfo[1].textContent = state.params.type;
});

// ── All-finalized check ───────────────────────────────────────

async function checkAllFinalized() {
  const allFinalized = [...rowRegistry.values()].every((row) => row.finalized);
  makeBtn.disabled = !allFinalized;

  if (allFinalized) {
    await composeCover(
      coverCanvases,
      coverScopes,
      state.finalizedMap,
      state.params,
      state.title,
    );
  }
}

// ── Navigation ────────────────────────────────────────────────

function setView(view) {
  app.classList.remove("Evo-View", "Abt-View", "Cover-View");
  app.classList.add(view);
}
window.setView = setView;
