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
const evolutionMessage = document.getElementById("evolution-message");
const statusMsg = document.getElementById("status-message");

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
  statusMsg.classList.remove("active");
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  stagedBook = null;
  statusMsg.textContent = "Searching books...";
  statusMsg.classList.add("active");

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

  statusMsg.textContent = "Loading...";
  statusMsg.classList.add("active");
  try {
    state.params = await extractBookParams(stagedBook);

    statusMsg.classList.remove("active");
    evolutionMessage.textContent =
      "Select one or more glyphs per letter to guide its evolution.";
  } catch (error) {
    console.error("Error extracting book parameters:", error);

    let retrySeconds = null;

    try {
      // 1. extract JSON part from "Gemini API error: {...}"
      const jsonStart = error.message.indexOf("{");

      if (jsonStart !== -1) {
        const jsonString = error.message.slice(jsonStart);
        const errData = JSON.parse(jsonString);

        const retryInfo = errData?.error?.details?.find((d) =>
          d["@type"]?.includes("RetryInfo"),
        );

        const retryDelay = retryInfo?.retryDelay;

        if (retryDelay?.endsWith("s")) {
          retrySeconds = parseInt(retryDelay, 10);
        }
      }
    } catch (e) {
      console.warn("Could not parse retry info:", e);
    }

    statusMsg.textContent = retrySeconds
      ? `Rate limit reached. Try again in ~${retrySeconds}s.`
      : "Error extracting book parameters. Please try again.";

    statusMsg.classList.add("active");
    evolutionMessage.textContent =
      "Service might be overloaded. Please try again.";

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

  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.remove("active");
  });

  const viewToLink = {
    "Evo-View": "#create",
    "Abt-View": "#about",
    "Cover-View": "#create",
  };

  const selector = viewToLink[view];
  if (selector) {
    const activeLink = document.querySelector(`nav a[href="${selector}"]`);
    if (activeLink) activeLink.classList.add("active");
  }
}
window.setView = setView;
