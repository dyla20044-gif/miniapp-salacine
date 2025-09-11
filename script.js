import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuración de Firebase (ACTUALIZADO) ---
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
const heroBanner = document.querySelector('.hero-banner');
const searchIconTop = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');
const movieCatalog = document.getElementById('movie-catalog');
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

let moviesData = [];

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

function showMovieDetails(movie) {
    document.getElementById('modal-poster').src = movie.poster ? movie.poster : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster');
    document.getElementById('modal-poster').alt = movie.title || movie.name;
    document.getElementById('modal-title').textContent = movie.title || movie.name;
    document.getElementById('modal-description').textContent = movie.description || movie.overview;
    
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

    const tvSeries = await fetchFromTMDB('tv/popular');
    renderCarousel('series-movies', tvSeries);
    
    const bannerMovie = trendingMovies[Math.floor(Math.random() * trendingMovies.length)];
    const backdropUrl = bannerMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${bannerMovie.backdrop_path}` : `https://placehold.co/1080x600?text=${bannerMovie.title || bannerMovie.name}`;
    heroBanner.style.backgroundImage = `url('${backdropUrl}')`;
    
    heroBanner.onclick = () => showMovieDetails(bannerMovie);
}

// --- Search Logic ---
searchIconTop.addEventListener('click', () => {
    movieCatalog.style.display = 'none';
    searchResultsSection.style.display = 'block';
    searchInput.value = '';
    searchInput.focus();
});

searchInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    searchResultsList.innerHTML = '';

    if (query.length > 2) {
        const searchResults = await fetchFromTMDB('search/multi', query);
        if (searchResults.length > 0) {
            searchResults.forEach(movie => {
                if (movie.media_type !== 'person' && movie.poster_path) {
                    searchResultsList.appendChild(createMovieCard(movie));
                }
            });
        } else {
            searchResultsList.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">No se encontraron resultados.</p>';
        }
    }
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
});
