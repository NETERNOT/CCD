export const state = {
  book: null,          // full Open Library record { title, author, key, coverId, ... }
  params: null,        // { complexity, openness, darkness, extensiveness, type }
  title: '',           // cleaned uppercase title, e.g. "PRIDE AND PREJUDICE"
  populationMap: null, // Map<char, genome[]>  — from createPopulationMap()
  selectedMap: null,   // Map<char, genome[]>  — user's current selections, from UI
}

function resetState(){
    state.book = null;
    state.params = null;
    state.title = '';
    state.populationMap = null;
    state.selectedMap = null;
}

function setBook(book){
    state.book = book;
    state.title = book.title.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function setParams(params){
    state.params = params;
}
