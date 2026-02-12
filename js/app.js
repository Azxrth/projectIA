import { getPopularMovies, getGenres } from "./api.js";

const moviesContainer = document.getElementById("movies");
const filtersContainer = document.getElementById("filters");

let genresList = [];
let cachedMovies = [];
let dataLoaded = false;
let filtersInitialized = false;
let scoringContext = null;

const BASE_WEIGHTS = {
    rating: 0.4,
    popularity: 0.25,
    recency: 0.2,
    votes: 0.15
};

// Valeurs des sliders (0–100). 50 = importance "normale".
const weightState = {
    rating: 50,
    popularity: 50,
    recency: 50
};

const filtersState = {
    genreId: "all",
    minYear: "",
    minRating: "",
    language: "all"
};
let favorites = [];

const FAVORITES_KEY = "favorites_v1";

function getGenreNames(genreIds) {
    return genreIds
        .map(id => genresList.find(g => g.id === id)?.name)
        .filter(Boolean)
        .join(", ");
}

function getYear(movie) {
    const year = movie.release_date?.split("-")[0];
    return year ? Number(year) : 0;
}

function getLanguageLabel(code) {
    const map = {
        fr: "Français",
        en: "Anglais",
        es: "Espagnol",
        it: "Italien",
        de: "Allemand",
        ja: "Japonais",
        ko: "Coréen",
        zh: "Chinois"
    };

    return map[code] || code?.toUpperCase() || "N/A";
}

async function ensureData() {
    if (dataLoaded) return;

    cachedMovies = await getPopularMovies();
    genresList = await getGenres();
    computeScoringContext();
    dataLoaded = true;
    populateFilterOptions();
}

function computeScoringContext() {
    if (!cachedMovies.length) {
        scoringContext = null;
        return;
    }

    const currentYear = new Date().getFullYear();

    let maxPopularity = 0;
    let maxVoteCount = 0;
    let minYear = currentYear;
    let maxYear = 1900;

    cachedMovies.forEach(movie => {
        if (typeof movie.popularity === "number") {
            maxPopularity = Math.max(maxPopularity, movie.popularity);
        }
        if (typeof movie.vote_count === "number") {
            maxVoteCount = Math.max(maxVoteCount, movie.vote_count);
        }

        const year = getYear(movie);
        if (year) {
            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);
        }
    });

    if (minYear > maxYear) {
        minYear = maxYear;
    }

    scoringContext = {
        currentYear,
        maxPopularity: maxPopularity || 1,
        maxVoteCount: maxVoteCount || 1,
        minYear,
        maxYear
    };
}

function populateFilterOptions() {
    if (!filtersContainer) return;

    const genreSelect = filtersContainer.querySelector("#filter-genre");
    const languageSelect = filtersContainer.querySelector("#filter-language");

    if (genreSelect) {
        const options = ["<option value=\"all\">Tous les genres</option>"];
        genresList.forEach(genre => {
            options.push(`<option value="${genre.id}">${genre.name}</option>`);
        });
        genreSelect.innerHTML = options.join("");
        genreSelect.value = filtersState.genreId;
    }

    if (languageSelect) {
        const codes = Array.from(
            new Set(cachedMovies.map(movie => movie.original_language).filter(Boolean))
        ).sort();

        const options = ["<option value=\"all\">Toutes les langues</option>"];
        codes.forEach(code => {
            options.push(`<option value="${code}">${getLanguageLabel(code)}</option>`);
        });
        languageSelect.innerHTML = options.join("");
        languageSelect.value = filtersState.language;
    }
}

function setupFilters() {
    if (!filtersContainer || filtersInitialized) return;

    filtersContainer.innerHTML = `
        <div class="filters">
            <div class="filter-group">
                <label for="filter-genre">Genre</label>
                <select id="filter-genre"></select>
            </div>
            <div class="filter-group">
                <label for="filter-year">Année minimum</label>
                <input id="filter-year" type="number" min="1900" max="2100" placeholder="Ex: 2015">
            </div>
            <div class="filter-group">
                <label for="filter-rating">Note minimum</label>
                <input id="filter-rating" type="number" min="0" max="10" step="0.1" placeholder="Ex: 7.5">
            </div>
            <div class="filter-group">
                <label for="filter-language">Langue</label>
                <select id="filter-language"></select>
            </div>
            <button id="filter-clear" type="button">Réinitialiser</button>
            <div class="weights-panel">
                <h3>Pondération du score</h3>
                <div class="weight-row">
                    <label for="weight-rating">Note</label>
                    <input id="weight-rating" type="range" min="0" max="100" step="25" value="50">
                    <span class="weight-value" data-weight-label="rating"></span>
                </div>
                <div class="weight-row">
                    <label for="weight-popularity">Popularité</label>
                    <input id="weight-popularity" type="range" min="0" max="100" step="25" value="50">
                    <span class="weight-value" data-weight-label="popularity"></span>
                </div>
                <div class="weight-row">
                    <label for="weight-recency">Récence</label>
                    <input id="weight-recency" type="range" min="0" max="100" step="25" value="50">
                    <span class="weight-value" data-weight-label="recency"></span>
                </div>
            </div>
        </div>
    `;

    const genreSelect = filtersContainer.querySelector("#filter-genre");
    const yearInput = filtersContainer.querySelector("#filter-year");
    const ratingInput = filtersContainer.querySelector("#filter-rating");
    const languageSelect = filtersContainer.querySelector("#filter-language");
    const clearButton = filtersContainer.querySelector("#filter-clear");
    const weightRatingInput = filtersContainer.querySelector("#weight-rating");
    const weightPopularityInput = filtersContainer.querySelector("#weight-popularity");
    const weightRecencyInput = filtersContainer.querySelector("#weight-recency");
    const weightLabels = filtersContainer.querySelectorAll(".weight-value");

    yearInput.value = filtersState.minYear;
    ratingInput.value = filtersState.minRating;

    genreSelect.addEventListener("change", () => {
        filtersState.genreId = genreSelect.value;
        renderByRoute();
    });

    languageSelect.addEventListener("change", () => {
        filtersState.language = languageSelect.value;
        renderByRoute();
    });

    yearInput.addEventListener("input", () => {
        filtersState.minYear = yearInput.value;
        renderByRoute();
    });

    ratingInput.addEventListener("input", () => {
        filtersState.minRating = ratingInput.value;
        renderByRoute();
    });

    const syncWeightsUI = () => {
        if (!weightRatingInput || !weightPopularityInput || !weightRecencyInput) return;

        weightRatingInput.value = String(weightState.rating);
        weightPopularityInput.value = String(weightState.popularity);
        weightRecencyInput.value = String(weightState.recency);

        weightLabels.forEach(label => {
            const key = label.dataset.weightLabel;
            const rawValue = weightState[key];
            const percent = Math.round(rawValue); // déjà sur 0–100

            let text = `${percent}%`;
            if (key === "rating") text += " note";
            else if (key === "popularity") text += " popul.";
            else if (key === "recency") text += " récence";

            label.textContent = text;
        });
    };

    const handleWeightsChange = () => {
        if (!weightRatingInput || !weightPopularityInput || !weightRecencyInput) return;

        weightState.rating = Number(weightRatingInput.value);
        weightState.popularity = Number(weightPopularityInput.value);
        weightState.recency = Number(weightRecencyInput.value);

        syncWeightsUI();
        renderByRoute();
    };

    syncWeightsUI();

    if (weightRatingInput && weightPopularityInput && weightRecencyInput) {
        weightRatingInput.addEventListener("input", handleWeightsChange);
        weightPopularityInput.addEventListener("input", handleWeightsChange);
        weightRecencyInput.addEventListener("input", handleWeightsChange);
    }

    clearButton.addEventListener("click", () => {
        filtersState.genreId = "all";
        filtersState.minYear = "";
        filtersState.minRating = "";
        filtersState.language = "all";

        yearInput.value = "";
        ratingInput.value = "";

        populateFilterOptions();
        renderByRoute();
    });

    filtersInitialized = true;
    populateFilterOptions();
}

function applyFilters(movies) {
    const genreId = filtersState.genreId !== "all" ? Number(filtersState.genreId) : null;
    const minYear = filtersState.minYear ? Number(filtersState.minYear) : null;
    const minRating = filtersState.minRating ? Number(filtersState.minRating) : null;
    const language = filtersState.language !== "all" ? filtersState.language : null;

    return movies.filter(movie => {
        if (genreId && !movie.genre_ids?.includes(genreId)) return false;
        if (minYear && getYear(movie) < minYear) return false;
        if (minRating && movie.vote_average < minRating) return false;
        if (language && movie.original_language !== language) return false;
        return true;
    });
}

function renderNoResults() {
    moviesContainer.innerHTML = `
        <div class="no-results">
            <h3>Aucun film ne correspond à ces critères.</h3>
            <p>Essayez d'élargir vos filtres.</p>
        </div>
    `;
}

function renderByRoute() {
    const route = window.location.hash;

    if (route === "#classement") {
        displayRanking();
    } else {
        displayMovies();
    }
}


// 🔹 Fonction de scoring personnalisée (note, popularité, récence, nombre de votes)
function calculateScore(movie) {
    if (!scoringContext) {
        computeScoringContext();
    }

    const { maxPopularity, maxVoteCount, minYear, maxYear } = scoringContext || {};

    const rating = typeof movie.vote_average === "number" ? movie.vote_average : 0;
    const popularity = typeof movie.popularity === "number" ? movie.popularity : 0;
    const voteCount = typeof movie.vote_count === "number" ? movie.vote_count : 0;
    const year = getYear(movie);

    // Normalisation des différentes métriques entre 0 et 1
    const normalizedRating = rating / 10; // note sur 10

    const normalizedPopularity =
        maxPopularity && maxPopularity > 0 ? Math.min(popularity / maxPopularity, 1) : 0;

    const normalizedVotes =
        maxVoteCount && maxVoteCount > 0
            ? Math.log10(voteCount + 1) / Math.log10(maxVoteCount + 1)
            : 0;

    let normalizedRecency = 0;
    if (year) {
        const span = Math.max(maxYear - minYear, 1);
        normalizedRecency = (year - minYear) / span;
    }
    // Conversion des sliders (0–100) en multiplicateurs ~[0, 2]
    const multipliers = {
        rating: weightState.rating / 50 || 0,
        popularity: weightState.popularity / 50 || 0,
        recency: weightState.recency / 50 || 0
    };

    // Pondérations de base modulées par l'utilisateur
    const weights = {
        rating: BASE_WEIGHTS.rating * multipliers.rating,
        popularity: BASE_WEIGHTS.popularity * multipliers.popularity,
        recency: BASE_WEIGHTS.recency * multipliers.recency,
        // le poids des votes reste fixe, pour garder un minimum de fiabilité
        votes: BASE_WEIGHTS.votes
    };

    const score =
        normalizedRating * weights.rating +
        normalizedPopularity * weights.popularity +
        normalizedRecency * weights.recency +
        normalizedVotes * weights.votes;

    // On remet le score sur une échelle 0–100 pour lecture humaine
    return score * 100;
}


function analyzeMovie(movie) {
    const year = getYear(movie);

    const ctx = scoringContext;
    const rating = typeof movie.vote_average === "number" ? movie.vote_average : 0;
    const popularity = typeof movie.popularity === "number" ? movie.popularity : 0;
    const voteCount = typeof movie.vote_count === "number" ? movie.vote_count : 0;

    const currentYear = new Date().getFullYear();

    const isRecent = ctx
        ? year && year >= ctx.maxYear - 3
        : year && year >= currentYear - 3;

    const isPopular = ctx
        ? popularity >= ctx.maxPopularity * 0.6
        : popularity > 100;

    const isWellRated = rating >= 7;

    const hasManyVotes = ctx
        ? voteCount >= ctx.maxVoteCount * 0.5
        : voteCount >= 1000;

    return {
        year: year || "N/A",
        isRecent: Boolean(isRecent),
        isPopular: Boolean(isPopular),
        isWellRated,
        hasManyVotes
    };
}

function explainScore(movie) {
    const score = calculateScore(movie);
    const analysis = analyzeMovie(movie);

    let explanation = "";
    let details = "";

    if (score >= 80) {
        explanation = "Film hautement recommandé ⭐";
        const reasons = [];
        if (analysis.isWellRated) reasons.push("très bonne note");
        if (analysis.isRecent) reasons.push("récent");
        if (analysis.isPopular) reasons.push("populaire");
        if (analysis.hasManyVotes) reasons.push("beaucoup de votes");
        details = reasons.length > 0 ? `(${reasons.join(", ")})` : "";
    } else if (score >= 60) {
        explanation = "Film recommandé 👍";
        const reasons = [];
        if (analysis.isWellRated) reasons.push("bonne note");
        if (analysis.isPopular) reasons.push("populaire");
        details = reasons.length > 0 ? `(${reasons.join(", ")})` : "";
    } else if (score >= 40) {
        explanation = "Film intéressant 📽️";
        details = "";
    } else {
        explanation = "Film à vérifier 🔍";
        details = "";
    }

    return {
        explanation: explanation,
        details: details
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
    await ensureData();
    setupFilters();

    const movies = applyFilters(cachedMovies);

    moviesContainer.innerHTML = "";

    if (movies.length === 0) {
        renderNoResults();
        return;
    }

    movies.forEach(movie => {
        const analysis = analyzeMovie(movie);
        const votesLabel =
            typeof movie.vote_count === "number"
                ? movie.vote_count.toLocaleString("fr-FR")
                : "N/A";

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
                <p>Langue : ${getLanguageLabel(movie.original_language)}</p>
                <p>Votes : ${votesLabel}</p>
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
    await ensureData();
    setupFilters();

    const movies = applyFilters(cachedMovies);

    movies.sort((a, b) => calculateScore(b) - calculateScore(a));

    moviesContainer.innerHTML = "<h2>Classement personnalisé</h2>";

    if (movies.length === 0) {
        renderNoResults();
        return;
    }

    movies.forEach((movie, index) => {
        const analysis = analyzeMovie(movie);
        const votesLabel =
            typeof movie.vote_count === "number"
                ? movie.vote_count.toLocaleString("fr-FR")
                : "N/A";

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
                <p>Langue : ${getLanguageLabel(movie.original_language)}</p>
                <p>Note : ${
                    typeof movie.vote_average === "number"
                        ? movie.vote_average.toFixed(1)
                        : "N/A"
                }</p>
                <p>Votes : ${votesLabel}</p>
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
