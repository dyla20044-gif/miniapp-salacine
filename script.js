import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuración de Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyCF5lyEIFkKhzgc4kOMebWZ7oZrxWDNw2Y",
    authDomain: "app-aeff2.firebaseapp.com",
    projectId: "app-aeff2",
    storageBucket: "app-aeff2.firebasestorage.app",
    messagingSenderId: "12229598213",
    appId: "1:12229598213:web:80555d9d22c30b69ddd06c",
    measurementId: "G-ZMQN0D6D4S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Elementos del DOM ---
const homeScreen = document.getElementById('home-screen');
const moviesScreen = document.getElementById('movies-screen');
const seriesScreen = document.getElementById('series-screen');
const profileScreen = document.getElementById('profile-screen');
const detailsScreen = document.getElementById('details-screen');

const navItems = document.querySelectorAll('.bottom-nav .nav-item');

const searchInput = document.getElementById('search-input');
const searchIconTop = document.getElementById('search-icon');
const movieCatalog = document.getElementById('carousels-container');
const searchResultsSection = document.getElementById('search-results-section');
const searchResultsList = document.getElementById('search-results-list');

const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeButtons = document.querySelectorAll('.close-button');

const detailsPosterTop = document.getElementById('details-poster-top');
const detailsPlayButton = document.getElementById('details-play-button');
const detailsTitle = document.getElementById('details-title');
const detailsYear = document.getElementById('details-year');
const detailsGenres = document.getElementById('details-genres');
const detailsSinopsis = document.getElementById('details-sinopsis');
const readMoreButton = document.getElementById('read-more-button');
const directorName = document.getElementById('director-name');
const actorsList = document.getElementById('actors-list');
const relatedMoviesContainer = document.getElementById('related-movies');

const genresButton = document.getElementById('genres-button');
const genresModal = document.getElementById('genres-modal');
const genresList = document.getElementById('genres-list');
const allMoviesGrid = document.getElementById('all-movies-grid');
const allSeriesGrid = document.getElementById('all-series-grid');

const bannerList = document.getElementById('banner-list');
const bannerWatchBtn = document.getElementById('banner-watch-btn');
const bannerPremiumBtn = document.getElementById('banner-premium-btn');
const bannerMylistBtn = document.getElementById('banner-mylist-btn');


let moviesData = [];
let bannerMovies = [];
let allGenres = {};

// --- Funciones para manejar Modales ---
function closeModal(modal) {
    modal.style.display = 'none';
    if (modal.id === 'video-modal') {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
}

function showModal(modal) {
    modal.style.display = 'flex';
}

closeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const modal = event.target.closest('.modal');
        if (modal) {
            closeModal(modal);
        }
    });
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

// --- Funciones de Renderizado ---
function createMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster';
    movieCard.innerHTML = `<img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster">`;
    movieCard.addEventListener('click', () => showDetailsScreen(movie));
    return movieCard;
}

function createBannerItem(movie) {
    const bannerItem = document.createElement('div');
    bannerItem.className = 'banner-item';
    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1080x600?text=No+Banner';
    bannerItem.style.backgroundImage = `url('${backdropUrl}')`;
    
    bannerItem.addEventListener('click', () => showDetailsScreen(movie));
    return bannerItem;
}

function renderCarousel(containerId, movies) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    movies.forEach(movie => {
        container.appendChild(createMovieCard(movie));
    });
}

function renderGrid(container, movies) {
    container.innerHTML = '';
    movies.forEach(movie => {
        container.appendChild(createMovieCard(movie));
    });
}

async function showDetailsScreen(movie) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    detailsScreen.classList.add('active');

    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster';
    detailsPosterTop.style.backgroundImage = `url('${posterUrl}')`;

    detailsTitle.textContent = movie.title || movie.name;
    detailsSinopsis.textContent = movie.overview || 'Sin sinopsis disponible.';
    detailsYear.textContent = movie.release_date ? movie.release_date.substring(0, 4) : '';
    detailsGenres.textContent = movie.genre_ids.map(id => allGenres[id]).join(', ');
    
    // Fetch credits for director and actors
    const credits = await fetchFromTMDB(`movie/${movie.id}/credits`);
    const director = credits.crew.find(c => c.job === 'Director');
    directorName.textContent = director ? director.name : 'No disponible';
    const actors = credits.cast.slice(0, 3).map(a => a.name).join(', ');
    actorsList.textContent = actors || 'No disponible';
    
    const localMovie = moviesData.find(m => m.tmdbId === movie.id);
    
    detailsPlayButton.onclick = () => {
        if (localMovie && localMovie.videoLink) {
            videoPlayer.src = localMovie.videoLink;
            showModal(videoModal);
            videoPlayer.play();
        } else {
            alert('Esta película no tiene un enlace de video disponible.');
        }
    };
    
    const related = await fetchFromTMDB(`movie/${movie.id}/similar`);
    renderCarousel('related-movies', related);
}


// --- TMDb & Firebase Data Fetching ---
async function fetchFromTMDB(endpoint, query = '') {
    const url = query ? `/api/tmdb?endpoint=${endpoint}&query=${encodeURIComponent(query)}` : `/api/tmdb?endpoint=${endpoint}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Error fetching from local server:', response.status);
        return [];
    }
    const data = await response.json();
    return data.results || data.items || data;
}

async function fetchAllGenres() {
    const genres = await fetchFromTMDB('genre/movie/list');
    genres.forEach(genre => {
        allGenres[genre.id] = genre.name;
    });
    renderGenres();
}

async function fetchHomeContent() {
    const popularMovies = await fetchFromTMDB('movie/popular');
    renderCarousel('populares-movies', popularMovies);

    const trendingMovies = await fetchFromTMDB('trending/all/day');
    renderCarousel('tendencias-movies', trendingMovies);

    const actionMovies = await fetchFromTMDB('discover/movie?with_genres=28');
    renderCarousel('accion-movies', actionMovies);

    const terrorMovies = await fetchFromTMDB('discover/movie?with_genres=27,9648');
    renderCarousel('terror-movies', terrorMovies);
    
    bannerMovies = trendingMovies.filter(m => m.backdrop_path);
    renderBannerCarousel();
}

function renderBannerCarousel() {
    bannerList.innerHTML = '';
    bannerMovies.forEach(movie => {
        bannerList.appendChild(createBannerItem(movie));
    });
    // Auto-scroll logic here
}


function renderGenres() {
    genresList.innerHTML = '';
    for (const id in allGenres) {
        const genreButton = document.createElement('button');
        genreButton.className = 'button secondary';
        genreButton.textContent = allGenres[id];
        genreButton.onclick = () => {
            fetchFromTMDB(`discover/movie?with_genres=${id}`).then(movies => {
                renderGrid(allMoviesGrid, movies);
                document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
                moviesScreen.classList.add('active');
                closeModal(genresModal);
            });
        };
        genresList.appendChild(genreButton);
    }
}

// --- Search Logic ---
document.getElementById('search-icon').addEventListener('click', () => {
    const query = searchInput.value;
    if (query.length > 2) {
        handleSearch(query);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSearch(searchInput.value);
    }
});

searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 2) {
        handleSearch(e.target.value);
    } else {
        homeScreen.classList.add('active');
        searchResultsSection.classList.remove('active');
    }
});

async function handleSearch(query) {
    if (query.length > 2) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        searchResultsSection.classList.add('active');
        const searchResults = await fetchFromTMDB('search/multi', query);
        renderGrid(searchResultsList, searchResults.filter(m => m.media_type !== 'person' && m.poster_path));
    }
}

// --- Navegación ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        const targetScreenId = e.currentTarget.getAttribute('data-screen');
        document.getElementById(targetScreenId).classList.add('active');
        e.currentTarget.classList.add('active');

        if (targetScreenId === 'movies-screen') {
            renderAllMovies();
        } else if (targetScreenId === 'series-screen') {
            renderAllSeries();
        }
    });
});

genresButton.addEventListener('click', () => {
    showModal(genresModal);
});

async function renderAllMovies() {
    const movies = await fetchFromTMDB('discover/movie?sort_by=popularity.desc');
    renderGrid(allMoviesGrid, movies);
}

async function renderAllSeries() {
    const series = await fetchFromTMDB('discover/tv?sort_by=popularity.desc');
    renderGrid(allSeriesGrid, series);
}

// --- Initialization ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        await signInAnonymously(auth);
    }
    const moviesColRef = collection(db, 'movies');
    onSnapshot(moviesColRef, (snapshot) => {
        moviesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
    fetchHomeContent();
    fetchAllGenres();
});
