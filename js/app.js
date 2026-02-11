import { getPopularMovies, getGenres } from "./api.js";

const moviesContainer = document.getElementById("movies");

let genresList = [];

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

        moviesContainer.appendChild(div);
    });
}
