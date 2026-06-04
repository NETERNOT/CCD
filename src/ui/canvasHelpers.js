import paper from "paper";
import { buildPolylines } from "../typography/renderer.js";

export function setupCanvas(canvas, i) {
  if (i === 1 || i === 3) {
    canvas.width = 2000;
    canvas.height = 3000;
  } else if (i === 2) {
    canvas.width = 650;
    canvas.height = 6500;
  } else {
    canvas.width = 250;
    canvas.height = 250;
  }

  const scope = new paper.PaperScope();
  scope.setup(canvas);
  canvas.style.width = "";
  canvas.style.height = "";
  return scope;
}

export function drawGlyph(scope, genome, params) {
  scope.activate();
  scope.project.clear();

  const polylines = buildPolylines(genome);
  const cx = scope.view.size.width / 2;
  const cy = scope.view.size.height / 2;
  const scale = scope.view.size.height / 260; // max height:250, + some padding
  const strokeWidth =
    (9 / 117.5) * scope.view.size.width * params.extensiveness +
    (1 / 117.5) * scope.view.size.width;

  polylines.forEach((poly) => {
    if (poly.length < 2) return;
    const path = new scope.Path({
      strokeColor: "#000",
      strokeWidth: strokeWidth,
      strokeCap: "round",
      strokeJoin: "round",
    });
    poly.forEach((pt) => {
      path.add(new scope.Point(cx + pt.x * scale, cy + pt.y * scale));
    });
  });

  scope.view.update();
}
