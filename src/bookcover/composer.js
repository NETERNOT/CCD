import { getPalette } from "./colors";
import { buildPolylines } from "../typography/renderer";
import paper from "paper";

export function composeCover(canvases, scopes, finalGlyphs, params, title) {
  const { color1, color2 } = getPalette(params.type);
  const lines = title.split(" ");
  const polylines = [];
  lines.forEach((line) => {
    const letters = line.split("");
    const linePolys = letters.map((char) => {
      const glyph = finalGlyphs.get(char);
      console.log(glyph);
      return buildPolylines(glyph) || [];
    });
    polylines.push(linePolys);
  });

  
  canvases.forEach((canvas) => {
    canvas.style.backgroundColor = color1;
  });

  composeBack(finalGlyphs, scopes[1], color2, params);
  //composeSpine(state.title, scopes[2], color2);
  composeFront(polylines, scopes[3], color2, params);
}

export function randomizeColors(canvas, scopes, genre){
    const { color1, color2 } = getPalette(genre);

    canvas.forEach(c => c.style.backgroundColor = color1)
    scopes.forEach(s => s.project.activeLayer.children.forEach(p => p.strokeColor = color2))
}

function composeSpine(title, scope, color) {}

function composeBack(glyphs, scope, color, params) {
  scope.activate();
  scope.project.clear();

  const availableWidth = scope.view.size.width * 0.85;
  const scale = availableWidth / 250;
  const cx = scope.view.size.width / 2;
  const cy = scope.view.size.height / 2;
  const opacity = 1 / glyphs.size * 3;

  const strokeWidth = 9/117.5 * availableWidth * params.extensiveness + 1/117.5 * availableWidth;

  [...glyphs.values()].forEach((glyph) => {
    const glyphPolylines = buildPolylines(glyph);

    glyphPolylines.forEach((poly) => {
      if (poly.length < 2) return;

      const path = new scope.Path({
        strokeColor: color,
        strokeWidth: strokeWidth,
        strokeCap: "round",
        strokeJoin: "round",
        opacity: opacity,
      });

      poly.forEach((pt) => {
        path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
      });
    });
  });

  scope.view.update();
}

function composeFront(polylines, scope, color, params) {
  scope.activate();
  scope.project.clear();

  const longestLineLength = Math.max(...polylines.map((line) => line.length));

  const availableWidth = scope.view.size.width * 0.95;
  const padding = (scope.view.size.width - availableWidth) / 2;
  const availabeHeight = scope.view.size.height - padding * 2;

  let letterSize = availableWidth / longestLineLength;
  letterSize = Math.min(letterSize, availabeHeight / polylines.length);
  const strokeWidth = 9/117.5 * letterSize * params.extensiveness + 1/50 * letterSize;

  let lineHeight = 0; /* scope.view.size.height * 0.02; */
  if (
    availabeHeight - polylines.length * letterSize <
    (polylines.length - 1) * lineHeight
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
          strokeWidth: strokeWidth,
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
