import { getPopularMovies, getGenres } from "./api.js";

const moviesContainer = document.getElementById("movies");

let genresList = [];
let favorites = [];

const FAVORITES_KEY = "favorites_v1";

function getGenreNames(genreIds) {
    return genreIds
        .map(id => genresList.find(g => g.id === id)?.name)
        .filter(Boolean)
        .join(", ");
}


// 🔹 Fonction de scoring personnalisée
function calculateScore(movie) {
    const analysis = analyzeMovie(movie);

    let score = 0;

    score += movie.vote_average * 3;
    score += movie.popularity * 0.02;

    if (analysis.isRecent) score += 5;
    if (analysis.isWellRated) score += 5;
    if (analysis.isPopular) score += 3;

    return score;
}


// Fournit une explication lisible du score en indiquant les facteurs dominants
function explainScore(movie) {
    const analysis = analyzeMovie(movie);
    const parts = [];

    const votePart = movie.vote_average ? movie.vote_average * 3 : 0;
    parts.push({ key: 'Note', value: votePart, desc: `Note (${movie.vote_average ?? 'N/A'}) × 3 = ${votePart.toFixed(2)}` });

    const popPart = movie.popularity ? movie.popularity * 0.02 : 0;
    parts.push({ key: 'Popularité', value: popPart, desc: `Popularité (${movie.popularity?.toFixed(1) ?? 'N/A'}) × 0.02 = ${popPart.toFixed(2)}` });

    if (analysis.isRecent) parts.push({ key: 'Récence', value: 5, desc: 'Film récent (sorti ≥ 2020) : +5' });
    if (analysis.isWellRated) parts.push({ key: 'Bonne note', value: 5, desc: 'Bonne note (≥ 7) : +5' });
    if (analysis.isPopular) parts.push({ key: 'Tendance', value: 3, desc: 'Très populaire : +3' });

    const total = parts.reduce((s, p) => s + p.value, 0);

    // Trier par contribution décroissante et garder les 2-3 principaux facteurs
    const sorted = parts.slice().sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 3);

    // Construire une justification en français
    const topTexts = top.map((p, i) => `${i + 1}. ${p.key} — ${p.desc}`);

    const explanation = `Score estimé : ${total.toFixed(2)}. Principaux facteurs : ${top.map(p => p.key).join(', ')}.`;
    const details = topTexts.join(' | ');

    return { explanation, details, total };
}


function analyzeMovie(movie) {
    const year = movie.release_date?.split("-")[0];
    const isRecent = year >= 2020;
    const isPopular = movie.popularity > 100;
    const isWellRated = movie.vote_average >= 7;

    return {
        year,
        isRecent,
        isPopular,
        isWellRated
    };
}


// --- Favorites persistence and sync ---
function loadFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (!raw) return (favorites = []);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) favorites = parsed;
        else favorites = [];
    } catch (e) {
        console.error("Erreur en chargeant les favoris:", e);
        favorites = [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error("Erreur en sauvegardant les favoris:", e);
    }
}

function isFavorite(movieId) {
    return favorites.some(f => f.id === movieId);
}

function addFavorite(movie) {
    if (isFavorite(movie.id)) return false;

    // stocker un objet minimal et stable
    const item = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path || null,
        vote_average: movie.vote_average || null,
        release_date: movie.release_date || null
    };

    favorites.push(item);
    saveFavorites();
    return true;
}

function removeFavorite(movieId) {
    const before = favorites.length;
    favorites = favorites.filter(f => f.id !== movieId);
    if (favorites.length !== before) {
        saveFavorites();
        return true;
    }
    return false;
}

function createFavoriteButton(movie) {
    const btn = document.createElement("button");
    btn.className = "fav-btn";
    btn.type = "button";
    btn.dataset.id = movie.id;

    function refresh() {
        if (isFavorite(movie.id)) {
            btn.textContent = "★";
            btn.title = "Supprimer des favoris";
            btn.classList.add("is-fav");
        } else {
            btn.textContent = "☆";
            btn.title = "Ajouter aux favoris";
            btn.classList.remove("is-fav");
        }
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isFavorite(movie.id)) {
            removeFavorite(movie.id);
        } else {
            addFavorite(movie);
        }
        refresh();
    });

    refresh();
    return btn;
}

// Charger les favoris au chargement du module
loadFavorites();


// 🔹 Affichage simple
export async function displayMovies() {
    const movies = await getPopularMovies();
    genresList = await getGenres();

    moviesContainer.innerHTML = "";

    movies.forEach(movie => {
        const analysis = analyzeMovie(movie);

        const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
            : "https://via.placeholder.com/342x513?text=No+Image";

        const div = document.createElement("div");
        div.classList.add("movie-card");

        // construire le contenu et ajouter le bouton favoris séparément
        div.innerHTML = `
            <div class="poster-wrapper">
                <img src="${posterUrl}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>Année : ${analysis.year}</p>
                <p>Note : ${movie.vote_average}</p>
            </div>
        `;

        const btn = createFavoriteButton(movie);
        div.querySelector('.poster-wrapper').appendChild(btn);

        // Explication du score
        const expl = explainScore(movie);
        const explEl = document.createElement('p');
        explEl.className = 'explanation';
        explEl.textContent = expl.explanation;

        const detailsEl = document.createElement('small');
        detailsEl.className = 'explanation-details';
        detailsEl.textContent = expl.details;

        div.querySelector('.movie-info').appendChild(explEl);
        div.querySelector('.movie-info').appendChild(detailsEl);

        moviesContainer.appendChild(div);
    });
}


// 🔹 Classement personnalisé avec scoring
export async function displayRanking() {
    const movies = await getPopularMovies();
    genresList = await getGenres();

    movies.sort((a, b) => calculateScore(b) - calculateScore(a));

    moviesContainer.innerHTML = "<h2>Classement personnalisé</h2>";

    movies.forEach((movie, index) => {
        const analysis = analyzeMovie(movie);

        const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
            : "https://via.placeholder.com/342x513?text=No+Image";

        const div = document.createElement("div");
        div.classList.add("movie-card");

        div.innerHTML = `
            <div class="poster-wrapper">
                <img src="${posterUrl}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h3>${index + 1}. ${movie.title}</h3>
                <p>Score : ${calculateScore(movie).toFixed(2)}</p>
                <p>Année : ${analysis.year}</p>
            </div>
        `;

        const btn = createFavoriteButton(movie);
        div.querySelector('.poster-wrapper').appendChild(btn);

        // Explication du score pour le classement
        const expl = explainScore(movie);
        const explEl = document.createElement('p');
        explEl.className = 'explanation';
        explEl.textContent = expl.explanation;

        const detailsEl = document.createElement('small');
        detailsEl.className = 'explanation-details';
        detailsEl.textContent = expl.details;

        div.querySelector('.movie-info').appendChild(explEl);
        div.querySelector('.movie-info').appendChild(detailsEl);

        moviesContainer.appendChild(div);
    });
}
