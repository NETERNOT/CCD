import { getPalette } from "./colors";
import { buildPolylines } from "../typography/renderer";
import { setupCanvas } from "../ui/canvasHelpers";
import paper from "paper";

export function composeCover(finalGlyphs, params, title) {
  const { color1, color2 } = getPalette(params.type);

  const canvases = document.querySelectorAll("#sections-container canvas");
  let scopes = [];
  canvases.forEach((canvas) => {
    scopes.push(setupCanvas(canvas));
    canvas.style.backgroundColor = color1;
  });

  //composeBack(finalGlyphs, scopes[1], color2);
  //composeSpine(state.title, scopes[2], color2);

  const lines = title.split(" ");
  composeFront(lines, finalGlyphs, scopes[3], color2, params);
}

function composeSpine(title, scope, color) {}

function composeBack(glyphs, scope, color, params) {}

function composeFront(lines, glyphs, scope, color, params) {
  scope.activate();
  scope.project.clear();

  const longestLineLength = Math.max(...lines.map((line) => line.length));

  const polylines = [];
  lines.forEach((line) => {
    const letters = line.split("");
    const linePolys = letters.map((char) => {
      const glyph = glyphs.get(char);
      console.log(glyph);
      return buildPolylines(glyph) || [];
    });
    polylines.push(linePolys);
  });

  const availableWidth = scope.view.size.width * 0.95;
  const padding = (scope.view.size.width - availableWidth) / 2;
  const availabeHeight = scope.view.size.height - padding * 2;

  let letterSize = availableWidth / longestLineLength;
  letterSize = Math.min(letterSize, availabeHeight / lines.length);
  let lineHeight = 0; /* scope.view.size.height * 0.02; */
  if (
    availabeHeight - lines.length * letterSize <
    (lines.length - 1) * lineHeight
  )
    lineHeight = 0;

  const scale = letterSize / 250;

  for (let y = 0; y < polylines.length; y++) {
    for (let x = 0; x < polylines[y].length; x++) {
      const glyphPolylines = polylines[y][x]; // array of polylines for this glyph
      if (!glyphPolylines || glyphPolylines.length === 0) continue;

      glyphPolylines.forEach((poly) => {
        // each poly is one segment's points
        if (poly.length < 2) return;

        const cy = y * letterSize + padding + letterSize / 2 + lineHeight * y;
        const lineWidth = polylines[y].length;
        const lineStartX =
          scope.view.size.width / 2 - (lineWidth * letterSize) / 2;
        const cx = lineStartX + x * letterSize + letterSize / 2;

        const path = new scope.Path({
          strokeColor: color,
          strokeWidth: params.extensiveness * 4.5 + .5,
          strokeCap: "round",
          strokeJoin: "round",
        });
        poly.forEach((pt) => {
          path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
        });
      });
    }
  }

  scope.view.update();
}
