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
const heroBannerCarousel = document.querySelector('.hero-banner-carousel');
const searchIconTop = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');
const homeScreen = document.getElementById('home-screen');
const movieCatalog = document.getElementById('carousels-container');
const searchResultsSection = document.getElementById('search-results-section');
const searchResultsList = document.getElementById('search-results-list');
const movieModal = document.getElementById('movie-modal');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const premiumModal = document.getElementById('premium-modal');
const closeButtons = document.querySelectorAll('.close-button');
const requestButton = document.getElementById('request-button');
const watchButton = document.getElementById('watch-button');
const trailerButton = document.getElementById('trailer-button');
const seeMoreModal = document.getElementById('see-more-modal');
const seeMoreTitle = document.getElementById('see-more-title');
const seeMoreGrid = document.getElementById('see-more-grid');
const allMoviesGrid = document.getElementById('all-movies-grid');
const allSeriesGrid = document.getElementById('all-series-grid');
const moviesScreen = document.getElementById('movies-screen');
const seriesScreen = document.getElementById('series-screen');
const profileScreen = document.getElementById('profile-screen');
const navItems = document.querySelectorAll('.bottom-nav .nav-item');
const genresButton = document.getElementById('genres-button');
const genresModal = document.getElementById('genres-modal');
const genresList = document.getElementById('genres-list');
const modalBackdrop = document.getElementById('modal-backdrop');
const bannerList = document.getElementById('banner-list');

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
    movieCard.addEventListener('click', () => showMovieDetails(movie));
    return movieCard;
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

function showMovieDetails(movie) {
    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : (movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : null);
    
    if (backdropUrl) {
        modalBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    }

    document.getElementById('modal-poster').src = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster';
    document.getElementById('modal-poster').alt = movie.title || movie.name;
    document.getElementById('modal-title').textContent = movie.title || movie.name;
    document.getElementById('modal-sinopsis').textContent = movie.overview || 'Sin sinopsis disponible.';
    
    const localMovie = moviesData.find(m => m.tmdbId === movie.id);

    if (localMovie && localMovie.videoLink) {
        watchButton.style.display = 'block';
        requestButton.style.display = 'none';
        watchButton.onclick = () => {
            if (localMovie.isPremium) {
                showModal(premiumModal);
            } else {
                videoPlayer.src = localMovie.videoLink;
                showModal(videoModal);
                videoPlayer.play();
            }
        };
    } else {
        watchButton.style.display = 'none';
        requestButton.style.display = 'block';
        requestButton.onclick = () => {
            sendRequestToBot(movie);
            alert('¡Petición enviada! Te avisaremos cuando la película esté disponible.');
            closeModal(movieModal);
        };
    }

    if (movie.trailerLink) {
        trailerButton.href = movie.trailerLink;
        trailerButton.style.display = 'block';
    } else {
        trailerButton.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title || movie.name)} trailer`;
        trailerButton.style.display = 'block';
    }

    showModal(movieModal);
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
    return data.results || data.items || [];
}

async function fetchHomeMovies() {
    const popularMovies = await fetchFromTMDB('movie/popular');
    renderCarousel('populares-movies', popularMovies);

    const trendingMovies = await fetchFromTMDB('trending/all/day');
    renderCarousel('tendencias-movies', trendingMovies);

    const actionMovies = await fetchFromTMDB('discover/movie?with_genres=28');
    renderCarousel('accion-movies', actionMovies);

    const tvSeries = await fetchFromTMDB('tv/popular');
    renderCarousel('series-movies', tvSeries);
    
    const terrorMovies = await fetchFromTMDB('discover/movie?with_genres=27,9648');
    renderCarousel('terror-movies', terrorMovies);

    bannerMovies = trendingMovies.filter(m => m.backdrop_path);
    renderBannerCarousel();
}

function renderBannerCarousel() {
    bannerList.innerHTML = '';
    bannerMovies.forEach(movie => {
        const bannerItem = document.createElement('div');
        bannerItem.className = 'banner-item';
        const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1080x600?text=No+Banner';
        bannerItem.style.backgroundImage = `url('${backdropUrl}')`;
        bannerItem.innerHTML = `
            <div class="banner-content">
                <h2>${movie.title || movie.name}</h2>
                <p>${movie.overview ? movie.overview.substring(0, 100) + '...' : ''}</p>
            </div>
        `;
        bannerItem.addEventListener('click', () => showMovieDetails(movie));
        bannerList.appendChild(bannerItem);
    });
}

function renderAllMovies() {
    fetchFromTMDB('discover/movie?sort_by=popularity.desc').then(movies => {
        renderGrid(allMoviesGrid, movies);
    });
}

function renderAllSeries() {
    fetchFromTMDB('discover/tv?sort_by=popularity.desc').then(series => {
        renderGrid(allSeriesGrid, series);
    });
}

function renderGenres() {
    fetchFromTMDB('genre/movie/list').then(genres => {
        genresList.innerHTML = '';
        genres.forEach(genre => {
            const genreButton = document.createElement('button');
            genreButton.className = 'button secondary';
            genreButton.textContent = genre.name;
            genreButton.onclick = () => {
                fetchFromTMDB(`discover/movie?with_genres=${genre.id}`).then(movies => {
                    renderGrid(allMoviesGrid, movies);
                    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
                    moviesScreen.classList.add('active');
                    closeModal(genresModal);
                });
            };
            genresList.appendChild(genreButton);
        });
    });
}


// --- Search Logic ---
searchIconTop.addEventListener('click', () => {
    searchInput.focus();
    if (searchInput.value.length > 2) {
        handleSearch();
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 2) {
        handleSearch();
    }
});

async function handleSearch() {
    const query = searchInput.value;
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

// --- Bot Communication (Telegram) ---
async function sendRequestToBot(movie) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({ 
            type: 'movie_request', 
            movie: {
                title: movie.title || movie.name,
                tmdbId: movie.id,
                posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
            }
        }));
    }
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
    fetchHomeMovies();
    fetchGenres();
});
