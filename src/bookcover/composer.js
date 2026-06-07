import { getPalette } from "./colors";
import { buildPolylines } from "../typography/renderer";
import fontUrl from "../../assets/fonts/ESKlarheitGroteskMono-Bd.otf?url";
import paper from "paper";
import opentype from "opentype.js";

export async function composeCover(
  canvases,
  scopes,
  finalGlyphs,
  params,
  title,
) {
  const { color1, color2 } = getPalette(params.genre);
  const lines = title.split(" ");

  const polylines = [];
  lines.forEach((line) => {
    const letters = line.split("");
    const linePolys = letters.map((char) => {
      const glyph = finalGlyphs.get(char);
      //console.log(glyph);
      return buildPolylines(glyph) || [];
    });
    polylines.push(linePolys);
  });

  canvases.forEach((canvas) => {
    canvas.style.backgroundColor = color1;
  });

  composeBack(polylines, scopes[1], color2, params);
  await composeSpine(title, scopes[2], color2);
  composeFront(polylines, scopes[3], color2, params);
}

export function randomizeColors(canvas, scopes, genre) {
  const { color1, color2 } = getPalette(genre);

  canvas.forEach((c) => (c.style.backgroundColor = color1));
  scopes.forEach((s) =>
    s.project.activeLayer.children.forEach((p) => {
      if (p.strokeColor) p.strokeColor = color2;
      if (p.fillColor) p.fillColor = color2;
    }),
  );
}

async function composeSpine(title, scope, color) {
  scope.activate();
  scope.project.clear();

  const W = scope.view.size.width;
  const H = scope.view.size.height;
  const padding = 250;

  const buffer = await fetch(fontUrl).then((r) => r.arrayBuffer());
  const font = opentype.parse(buffer);

  let finalSize = 200;
  const testPath = font.getPath(title, 0, finalSize, finalSize);
  const bb = testPath.getBoundingBox();

  if (bb.x2 - bb.x1 > H - padding * 2) {
    finalSize *= (H - padding * 2) / (bb.x2 - bb.x1);
  }

  const drawnPaths = [];
  let path = null;
  let compoundPath = new scope.CompoundPath({
    fillColor: color,
    strokeColor: null,
    fillRule: "evenodd",
  });

  const finalPath = font.getPath(title, 0, finalSize, finalSize);

  for (const cmd of finalPath.commands) {
    if (cmd.type === "M") {
      path = new scope.Path();
      compoundPath.addChild(path);
      path.moveTo(new scope.Point(cmd.x, cmd.y));
    } else if (cmd.type === "L") {
      path.lineTo(new scope.Point(cmd.x, cmd.y));
    } else if (cmd.type === "C") {
      path.cubicCurveTo(
        new scope.Point(cmd.x1, cmd.y1),
        new scope.Point(cmd.x2, cmd.y2),
        new scope.Point(cmd.x, cmd.y),
      );
    } else if (cmd.type === "Q") {
      path.quadraticCurveTo(
        new scope.Point(cmd.x1, cmd.y1),
        new scope.Point(cmd.x, cmd.y),
      );
    } else if (cmd.type === "Z") {
      path.closePath();
    }
  }

  compoundPath.position = new scope.Point(
    W / 2 - H / 2 + compoundPath.bounds.width / 2 + padding,
    H / 2,
  );

  scope.project.activeLayer.rotate(90, new scope.Point(W / 2, H / 2));

  scope.view.update();
}

function composeBack(polylines, scope, color, params) {
  scope.activate();
  scope.project.clear();

  const rows = 6;
  const columns = 4;
  const gridSize = scope.view.size.width / columns;
  const letterSize = gridSize * 2;
  const scale = letterSize / 250;
  const strokeWidth =
    (9 / 150) * letterSize * params.extensiveness + (1 / 117.5) * letterSize;

  const polys = polylines.flat();
  console.log(polys.length);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;

      const cx = gridSize * x + gridSize / 2;
      const cy = gridSize * y + gridSize / 2;

      const selectedPoly = polys[index % polys.length];

      selectedPoly.forEach((pol) => {
        if (pol.length < 2) return;

        const path = new scope.Path({
          strokeColor: color,
          strokeWidth: strokeWidth,
          strokeCap: "round",
          strokeJoin: "round",
          opacity: 1,
        });

        pol.forEach((pt) => {
          path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
        });
      });
    }
  }

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
  const strokeWidth =
    (9 / 117.5) * letterSize * params.extensiveness + (1 / 50) * letterSize;

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

      const cy = y * letterSize + padding + letterSize / 2 + lineHeight * y;
      const lineWidth = polylines[y].length;
      const lineStartX =
        scope.view.size.width / 2 - (lineWidth * letterSize) / 2;
      const cx = lineStartX + x * letterSize + letterSize / 2;

      glyphPolylines.forEach((poly) => {
        // each poly is one segment's points
        if (poly.length < 2) return;

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
