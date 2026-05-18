import skeletons from "./skeletons.json";

const POPULATION_SIZE = 6;
const MUTATION_RATE = 0.1;
const TOURNAMENT_SIZE = 3;

// ── Helpers ───────────────────────────────────────────────────

function assignBreaks(strokeCount, totalBreaks) {
  const breaksArray = new Array(strokeCount).fill(0);
  while (totalBreaks > 0) {
    const i = Math.floor(Math.random() * strokeCount);
    breaksArray[i]++;
    totalBreaks--;
  }
  return breaksArray;
}

function randomBreakIndices(breaks, pointsCount) {
  const maxPossible = Math.floor((pointsCount - 2) / 2);
  const count = Math.min(breaks, maxPossible);
  const indices = [];
  while (indices.length < count) {
    const index = Math.floor(Math.random() * (pointsCount - 2) + 1);
    if (!indices.some((i) => Math.abs(i - index) < 2)) {
      indices.push(index);
    }
  }
  return indices.sort((a, b) => a - b);
}

function randomEdge() {
  return Math.random() < 0.5 ? "start" : "end";
}

// Returns all descendant indices of a segment (to prevent cycles)
function getDescendants(segments, index) {
  const descendants = new Set();
  const queue = [...segments[index].children];
  while (queue.length > 0) {
    const current = queue.shift();
    descendants.add(current);
    segments[current].children.forEach((child) => queue.push(child));
  }
  return descendants;
}

// ── Genome creation ───────────────────────────────────────────

function buildSegments(char, params) {
  const strokes = skeletons[char] || [];
  const totalBreaks = Math.round(params.complexity * 3 + 1);
  const breaksArray = assignBreaks(strokes.length, totalBreaks);
  const maxAngle = params.openness * Math.PI;

  const segments = [];
  strokes.forEach((stroke, si) => {
    const breakIndices = randomBreakIndices(
      breaksArray[si],
      stroke.points.length,
    );
    const boundaries = [0, ...breakIndices, stroke.points.length];
    for (let i = 0; i < boundaries.length - 1; i++) {
      segments.push({
        points: stroke.points.slice(boundaries[i], boundaries[i + 1]),
        angle: (Math.random() * 2 - 1) * maxAngle,
        children: [],
        parentEdge: null,
        selfEdge: null,
      });
    }
  });

  return segments;
}

function buildTree(segments) {
  if (segments.length === 0) return segments;

  const idx = Array.from({ length: segments.length }, (_, i) => i);
  const rootId = Math.floor(Math.random() * idx.length);
  const queue = [rootId];
  idx.splice(rootId, 1);

  while (queue.length > 0 && idx.length > 0) {
    const childrenCount = Math.floor(Math.random() * 2) + 1;
    const parent = queue.shift();
    const children = [];

    for (let i = 0; i < childrenCount && idx.length > 0; i++) {
      const childId = Math.floor(Math.random() * idx.length);
      const childSegIdx = idx[childId];

      children.push(idx[childId]);
      queue.push(idx[childId]);
      idx.splice(childId, 1);

      segments[childSegIdx].parentEdge = randomEdge();
      segments[childSegIdx].selfEdge = randomEdge();
    }

    segments[parent].children = children;
  }

  return { segments, rootId };
}

function createGenome(char, params) {
  const segments = buildSegments(char, params);
  const { segments: tree, rootId } = buildTree(segments);

  return { char, segments: tree, rootId };
}

// ── Mutation ──────────────────────────────────────────────────

function mutate(genome, params) {
  const clone = structuredClone(genome);
  const maxAngle = params.openness * Math.PI;

  clone.segments.forEach((seg, i) => {
    // Mutate angle
    if (Math.random() < MUTATION_RATE) {
      seg.angle = (Math.random() * 2 - 1) * maxAngle;
    }

    // Mutate connection — rewire to a different parent
    if (Math.random() < MUTATION_RATE && i !== clone.rootId) {
      const descendants = getDescendants(clone.segments, i);
      const candidates = clone.segments.filter(
        (candidate, id) =>
          id !== i && !descendants.has(id) && candidate.children.length < 3,
      );

      if (candidates.length > 0) {
        clone.segments.forEach((seg) => {
          seg.children = seg.children.filter((child) => child !== i);
        });

        const newParent =
          candidates[Math.floor(Math.random() * candidates.length)];
        newParent.children.push(i);
        seg.parentEdge = randomEdge();
        seg.selfEdge = randomEdge();
      }
    }
  });

  return clone;
}

// ── Selection ─────────────────────────────────────────────────

function tournamentSelect(population, selected) {
  const tournament = Array.from(
    { length: TOURNAMENT_SIZE },
    () => population[Math.floor(Math.random() * population.length)],
  );
  return tournament.find((g) => selected.includes(g)) || tournament[0];
}

// ── Population ────────────────────────────────────────────────

export function createNewPopulation(char, params) {
  return Array.from({ length: POPULATION_SIZE }, () =>
    createGenome(char, params),
  );
}

export function evolvePopulation(population, selected, params) {
  const survivors = selected.slice(0, POPULATION_SIZE);
  const next = [...survivors];
  while (next.length < POPULATION_SIZE) {
    const parent = tournamentSelect(population, survivors);
    next.push(mutate(parent, params));
  }
  return next;
}

export function createPopulationMap(title, params) {
  const unique = [...new Set(title.toUpperCase().replace(/[^A-Z0-9]/g, ""))];
  const map = new Map();
  for (const char of unique) {
    map.set(char, createNewPopulation(char, params));
  }
  return map;
}

export function evolvePopulationMap(populationMap, selectedMap, params) {
  const next = new Map();
  for (const [char, population] of populationMap) {
    const selected = selectedMap.get(char) || [population[0]];
    next.set(char, evolvePopulation(population, selected, params));
  }
  return next;
}
