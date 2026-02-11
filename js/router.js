import { displayMovies, displayRanking } from "./app.js";

function render() {
    const route = window.location.hash;

    if (route === "#classement") {
        displayRanking();
    } else {
        displayMovies();
    }
}

window.addEventListener("hashchange", render);

// Lancement initial
render();
