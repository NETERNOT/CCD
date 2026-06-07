/* state.js */
export const state = {
  book: null,               // openLibrary 
  params: null,             // { complexity, openness, darkness, extensiveness, type }
  title: '',                // Parsed Title
  populationMap: null,      // Map<char, genome[]>
  canvasSize: 200,          // overwritten on init for dynamic sizing
  finalizedMap: new Map(),  // char, genome
  view: 'evolution',        // 'evolution' | 'cover' | 'about'
}

export function resetState(){
    state.book = null;
    state.params = null;
    state.title = '';
    state.populationMap = null;
    state.selectedMap = null;
    state.canvasSize = 200;
    state.finalizedMap = new Map();
    state.view = 'evolution';
}

export function setBook(book){
    state.book = book;
    state.title = book.title.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
}

export function setParams(params){
    state.params = params;
}

export function finalizeGlyph(char, genome){
    state.finalizedMap.set(char,genome);
}

export function allLettersFinalized(){
    const unique = [...new Set(state.title.replace(/[^A-Z0-9]/g, ""))];
    return unique.every(char => state.finalizedMap.has(char));
}

export function setView(view){
    state.view = view;
}
