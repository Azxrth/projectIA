const API_KEY = "8d0f5e2de9572f2208b289d35874a321";
const BASE_URL = "https://api.themoviedb.org/3";

export async function getPopularMovies() {
    const response = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=fr-FR`
    );

    const data = await response.json();
    return data.results;
}

export async function getGenres() {
    const response = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=fr-FR`
    );

    const data = await response.json();
    return data.genres;
}
