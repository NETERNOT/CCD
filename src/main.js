import { createNewPopulation } from "./typography/genome.js";
import { buildPolylines } from "./typography/renderer.js";
import paper from "paper";

// ── Hardcoded test data ───────────────────────────────────────

const TEST_CHAR = "O";
const TEST_PARAMS = {
  complexity: 1,
  openness: 1,
  darkness: 0.5,
  extensiveness: 0.5,
  type: "vanilla",
};

const CANVAS_SIZE = 200;

// ── Create population ─────────────────────────────────────────

const population = createNewPopulation(TEST_CHAR, TEST_PARAMS);

// ── Build container ───────────────────────────────────────────

const app = document.getElementById("app");
app.style.display = "flex";
app.style.flexWrap = "wrap";
app.style.gap = "16px";
app.style.padding = "32px";

// ── Draw each individual ──────────────────────────────────────

population.forEach((genome, i) => {
  // Label
  const label = document.createElement("div");
  label.style.textAlign = "center";
  label.style.fontFamily = "monospace";
  label.style.fontSize = "11px";
  label.style.color = "#888";
  label.textContent = `${TEST_CHAR} — individual ${i + 1}`;

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  canvas.style.border = "1px solid #ddd";
  canvas.style.display = "block";

  // Wrapper
  const wrapper = document.createElement("div");
  wrapper.appendChild(canvas);
  wrapper.appendChild(label);
  app.appendChild(wrapper);

  // Draw with Paper.js
  const scope = new paper.PaperScope();
  scope.setup(canvas);
  scope.activate();

  const polylines = buildPolylines(genome);
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const scale = 0.8; // adjust if glyphs are too small or large

  polylines.forEach((poly) => {
    if (poly.length < 2) return;
    const path = new scope.Path({
      strokeColor: "#1a1612",
      strokeWidth: 10,
      strokeCap: "round",
      strokeJoin: "butt",
    });
    poly.forEach((pt) => {
      path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
    });
  });

  scope.view.update();
});
