function hsbToHsl(h, s, b) {
  s /= 100;
  b /= 100;
  const l = b * (1 - s / 2);
  const sl = l === 0 || l === 1 ? 0 : (b - l) / Math.min(l, 1 - l);
  return { h, s: sl * 100, l: l * 100 };
}

function hsbToCss(h, s, b) {
  const { h: hh, s: ss, l } = hsbToHsl(h, s, b);
  return `hsl(${Math.round(hh)}, ${Math.round(ss)}%, ${Math.round(l)}%)`;
}

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

function randomHueInRange(min, max) {
  return min + Math.random() * (max - min);
}

const PALETTE_GENERATORS = {
  literary: () => {
    const h1 = Math.random() * 360;
    const h2 = wrapHue(h1 + 35);
    return {
      color1: hsbToCss(h1, 35, 90),
      color2: hsbToCss(h2, 35, 70),
    };
  },

genre: () => {
    const usePurpleRange = Math.random() < 0.5;
    const h1 = usePurpleRange
      ? randomHueInRange(260, 325)
      : randomHueInRange(0, 25);
    const h2 = wrapHue(h1 + 35);
    return {
      color1: hsbToCss(h2, 100, 95),
      color2: hsbToCss(h1, 100, 95),
    };
  },

  historical: () => {
    const h1 = Math.random() * 360;
    const h2 = wrapHue(h1 + 35);
    const randomBrightness = 30 + Math.random() * 15; 
    return {
      color1: hsbToCss(h1, 25, randomBrightness),
      color2: hsbToCss(h2, 20, 65),
    };
  },

  crime: () => {
    const h1 = randomHueInRange(50, 260);
    const h2 = wrapHue(h1 + 20);
    return {
      color1: hsbToCss(h1, 80, 10),   
      color2: hsbToCss(h2, 100, 90),  
    };
  },

  experimental: () => {
    const h1 = Math.random() * 360;
    const h2 = wrapHue(h1 + 180);
    return {
      color1: hsbToCss(h1, 100, 75),
      color2: hsbToCss(h2, 100, 75),
    };
  },
};

const GENRE_KEYS = [
  "literary",
  "genre",
  "historical",
  "crime",
  "experimental",
];

export function getPalette(genre){
  const key = GENRE_KEYS[genre] ?? "literary";
  return PALETTE_GENERATORS[key]();
}

export function applyPalette(genreIndex) {
  const key = GENRE_KEYS[genreIndex] ?? "literary";
  const { color1, color2 } = PALETTE_GENERATORS[key]();

  const bg = document.getElementById("color_background");
  const el = document.getElementById("color_elements");

  if (bg) bg.style.backgroundColor = color1;
  if (el) el.style.backgroundColor = color2;
}

export function getSelectedGenreIndex() {
  const radios = document.querySelectorAll("#color-container input[type=radio]");
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) return i;
  }
  return 0;
}