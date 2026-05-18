function rotatePoints(points, angle) {
  const cx = points[0].x;
  const cy = points[0].y;

  return points.map((p) => {
    const x = p.x - cx;
    const y = p.y - cy;
    return {
      x: cx + x * Math.cos(angle) - y * Math.sin(angle),
      y: cy + x * Math.sin(angle) + y * Math.cos(angle),
    };
  });
}

function translatePoints(points, dx, dy) {
  return points.map((p) => {
    return {
      x: p.x + dx,
      y: p.y + dy,
    };
  });
}

function centerPoints(segments){
    if(segments.length === 0) return segments;
    const anchorPoint = {x:0,y:0}
    const allPoints = segments.flatMap(seg => seg.points);
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minX = Math.min(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));
    const minY = Math.min(...allPoints.map(p => p.y));

    const dx = anchorPoint.x - (maxX + minX) / 2;
    const dy = anchorPoint.y - (maxY + minY) / 2;

    return segments.map((seg) => {
        seg.points = translatePoints(seg.points, dx, dy);
        return seg;
    });;
}

export function buildPolylines(genome) {
  const clone = structuredClone(genome);
  const segs = clone.segments;

  segs.map((seg) => {
    seg.points = rotatePoints(seg.points, seg.angle);
  });

  if (segs.length === 0) return clone;

  const queue = [clone.rootId];

  while (queue.length > 0 ) {
    const parent = segs[queue.shift()];
    const parentStr = parent.points[0];
    const parentEnd = parent.points[parent.points.length - 1];

    for (let i = 0; i < parent.children.length ; i++) {
      const child = segs[parent.children[i]];
      const childPt = child.selfEdge === 'start' ? child.points[0] : child.points[child.points.length-1];
      const parentPt = child.parentEdge === 'start' ? parentStr : parentEnd;
      const dx = parentPt.x - childPt.x;
      const dy = parentPt.y - childPt.y;

      child.points = translatePoints(child.points, dx, dy);
      queue.push(parent.children[i]);
    }
  }

  clone.segments = centerPoints(segs);

  return clone.segments.map(seg => seg.points);
}
