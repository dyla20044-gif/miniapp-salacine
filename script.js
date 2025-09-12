import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeButtons = document.querySelectorAll('.close-button');
const detailsPosterTop = document.getElementById('details-poster-top');
const detailsPlayButton = document.getElementById('details-play-button');
const detailsTitle = document.getElementById('details-title');
const detailsYear = document.getElementById('details-year');
const detailsGenres = document.getElementById('details-genres');
const detailsSinopsis = document.getElementById('details-sinopsis');
const directorName = document.getElementById('director-name');
const actorsList = document.getElementById('actors-list');
const relatedMoviesContainer = document.getElementById('related-movies');
const genresButton = document.getElementById('genres-button');
const seriesGenresButton = document.getElementById('series-genres-button');
const genresModal = document.getElementById('genres-modal');
const genresList = document.getElementById('genres-list');
const allMoviesGrid = document.getElementById('all-movies-grid');
const allSeriesGrid = document.getElementById('all-series-grid');
const bannerList = document.getElementById('banner-list');
const loader = document.getElementById('loader');
const seeMoreButtons = document.querySelectorAll('.see-more-btn');

let moviesData = [];
let bannerMovies = [];
let allMovieGenres = {};
let allTvGenres = {};
let bannerInterval;

// --- Funciones para manejar Modales y Carga ---
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

function showLoader() {
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    if (loader) loader.style.display = 'none';
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
function createMovieCard(movie, type = 'movie') {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster';
    movieCard.innerHTML = `<img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-poster">`;
    movieCard.addEventListener('click', () => showDetailsScreen(movie, type));
    return movieCard;
}

function createBannerItem(movie) {
    const bannerItem = document.createElement('div');
    bannerItem.className = 'banner-item';
    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1080x600?text=No+Banner';
    bannerItem.style.backgroundImage = `url('${backdropUrl}')`;
    
    const localMovie = moviesData.find(m => m.tmdbId === movie.id);
    const isPremium = localMovie && localMovie.isPremium;
    const hasVideo = localMovie && localMovie.videoLink;

    bannerItem.innerHTML = `
        <div class="banner-buttons-container">
            <button class="banner-button watch-btn" style="display: ${hasVideo && !isPremium ? 'inline-block' : 'none'};">Ver ahora</button>
            <button class="banner-button premium-btn" style="display: ${hasVideo && isPremium ? 'inline-block' : 'none'};">Ver con Premium</button>
            <button class="banner-button mylist-btn"><i class="fas fa-plus"></i> Mi lista</button>
        </div>
    `;
    
    if (hasVideo && !isPremium) {
        bannerItem.querySelector('.watch-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            videoPlayer.src = localMovie.videoLink;
            showModal(videoModal);
            videoPlayer.play();
        });
    }
    if (hasVideo && isPremium) {
        bannerItem.querySelector('.premium-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            alert('¡Contenido Premium! Suscríbete para verlo.'); // Replace with premium modal
        });
    }
    bannerItem.querySelector('.mylist-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addToFavorites(movie);
    });

    bannerItem.addEventListener('click', () => showDetailsScreen(movie, movie.media_type || 'movie'));
    return bannerItem;
}

function renderCarousel(containerId, movies, type = 'movie') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    movies.forEach(movie => {
        container.appendChild(createMovieCard(movie, type));
    });
}

function renderGrid(container, movies, type = 'movie') {
    if (!container) return;
    container.innerHTML = '';
    movies.forEach(movie => {
        container.appendChild(createMovieCard(movie, type));
    });
}

async function showDetailsScreen(movie, type = 'movie') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    detailsScreen.classList.add('active');
    showLoader();

    try {
        const posterPath = movie.backdrop_path || movie.poster_path;
        const posterUrl = posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : 'https://placehold.co/500x750?text=No+Poster';
        detailsPosterTop.style.backgroundImage = `url('${posterUrl}')`;

        detailsTitle.textContent = movie.title || movie.name;
        detailsSinopsis.textContent = movie.overview || 'Sin sinopsis disponible.';
        detailsYear.textContent = (movie.release_date || movie.first_air_date) ? (movie.release_date || movie.first_air_date).substring(0, 4) : '';
        
        const genreNames = movie.genre_ids ? movie.genre_ids.map(id => (type === 'movie' ? allMovieGenres[id] : allTvGenres[id])).filter(Boolean).join(', ') : '';
        detailsGenres.textContent = genreNames;

        const creditsEndpoint = type === 'movie' ? `movie/${movie.id}/credits` : `tv/${movie.id}/credits`;
        const credits = await fetchFromTMDB(creditsEndpoint);
        
        const director = credits.crew.find(c => c.job === 'Director');
        directorName.textContent = director ? director.name : 'No disponible';
        const actors = credits.cast.slice(0, 3).map(a => a.name).join(', ');
        actorsList.textContent = actors || 'No disponible';
        
        const localMovie = moviesData.find(m => m.tmdbId === movie.id);
        
        if (detailsPlayButton) {
            detailsPlayButton.onclick = () => {
                if (localMovie && localMovie.videoLink) {
                    videoPlayer.src = localMovie.videoLink;
                    showModal(videoModal);
                    videoPlayer.play();
                } else {
                    alert('Esta película no tiene un enlace de video disponible.');
                }
            };
        }
        
        const relatedEndpoint = type === 'movie' ? `movie/${movie.id}/similar` : `tv/${movie.id}/similar`;
        const related = await fetchFromTMDB(relatedEndpoint);
        renderCarousel('related-movies', related, type);

    } catch (error) {
        console.error("Error showing details:", error);
        alert('Hubo un error al cargar los detalles. Intenta de nuevo.');
    } finally {
        hideLoader();
    }
}

// --- TMDb & Firebase Data Fetching ---
async function fetchFromTMDB(endpoint, query = '') {
    const url = query ? `/api/tmdb?endpoint=${endpoint}&query=${encodeURIComponent(query)}` : `/api/tmdb?endpoint=${endpoint}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error de la API: ${response.status} - ${response.statusText}`);
            throw new Error(`Error fetching from local server: ${response.status}`);
        }
        const data = await response.json();
        return data.results || data.items || data;
    } catch (error) {
        console.error("Error en la llamada a fetchFromTMDB:", error);
        throw error;
    }
}

async function fetchHomeContent() {
    showLoader();
    try {
        const popularMovies = await fetchFromTMDB('movie/popular');
        renderCarousel('populares-movies', popularMovies, 'movie');

        const trendingContent = await fetchFromTMDB('trending/all/day');
        renderCarousel('tendencias-movies', trendingContent, 'movie');

        const actionMovies = await fetchFromTMDB('discover/movie?with_genres=28');
        renderCarousel('accion-movies', actionMovies, 'movie');

        const terrorMovies = await fetchFromTMDB('discover/movie?with_genres=27,9648');
        renderCarousel('terror-movies', terrorMovies, 'movie');
        
        const animacionMovies = await fetchFromTMDB('discover/movie?with_genres=16');
        renderCarousel('animacion-movies', animacionMovies, 'movie');

        const documentalesMovies = await fetchFromTMDB('discover/movie?with_genres=99');
        renderCarousel('documentales-movies', documentalesMovies, 'movie');

        const scifiMovies = await fetchFromTMDB('discover/movie?with_genres=878');
        renderCarousel('scifi-movies', scifiMovies, 'movie');

        const popularSeries = await fetchFromTMDB('tv/popular');
        renderCarousel('populares-series', popularSeries, 'tv');
        
        bannerMovies = trendingContent.filter(m => m.backdrop_path);
        renderBannerCarousel();
        startBannerAutoScroll();
    } catch (error) {
        console.error("Error fetching home content:", error);
        alert('Hubo un error al cargar el contenido principal. Por favor, recarga la página.');
    } finally {
        hideLoader();
    }
}

function renderBannerCarousel() {
    bannerList.innerHTML = '';
    bannerMovies.forEach(movie => {
        bannerList.appendChild(createBannerItem(movie));
    });
}

function startBannerAutoScroll() {
    let currentIndex = 0;
    const scrollAmount = bannerList.clientWidth;
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        if (currentIndex < bannerMovies.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        bannerList.scrollTo({
            left: currentIndex * scrollAmount,
            behavior: 'smooth'
        });
    }, 3000);
}

async function fetchAllGenres(type = 'movie') {
    try {
        const genres = await fetchFromTMDB(`genre/${type}/list`);
        const genreMap = {};
        genres.genres.forEach(genre => {
            genreMap[genre.id] = genre.name;
        });
        if (type === 'movie') {
            allMovieGenres = genreMap;
        } else {
            allTvGenres = genreMap;
        }
    } catch (error) {
        console.error("Error fetching genres:", error);
    }
}

function renderGenresModal(type) {
    genresList.innerHTML = '';
    const currentGenres = type === 'movie' ? allMovieGenres : allTvGenres;
    for (const id in currentGenres) {
        const genreButton = document.createElement('button');
        genreButton.className = 'button secondary';
        genreButton.textContent = currentGenres[id];
        genreButton.onclick = () => {
            fetchFromTMDB(`discover/${type}?with_genres=${id}`).then(items => {
                renderGrid(type === 'movie' ? allMoviesGrid : allSeriesGrid, items, type);
                document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
                if (type === 'movie') moviesScreen.classList.add('active');
                else seriesScreen.classList.add('active');
                closeModal(genresModal);
            });
        };
        genresList.appendChild(genreButton);
    }
}

// --- Search Logic ---
searchIconTop.addEventListener('click', () => {
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
    const query = e.target.value;
    if (query.length > 2) {
        handleSearch(query);
    } else if (query.length === 0) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        homeScreen.classList.add('active');
    }
});

async function handleSearch(query) {
    if (query.length > 2) {
        showLoader();
        try {
            const searchResults = await fetchFromTMDB('search/multi', query);
            const filteredResults = searchResults.filter(m => m.media_type !== 'person' && m.poster_path);
            renderGrid(allMoviesGrid, filteredResults, 'movie');
            document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
            moviesScreen.classList.add('active');
        } catch (error) {
            console.error("Error performing search:", error);
            alert('Hubo un error en la búsqueda. Por favor, intenta de nuevo.');
        } finally {
            hideLoader();
        }
    }
}

// --- Navegación ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        const targetScreenId = e.currentTarget.getAttribute('data-screen');
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) targetScreen.classList.add('active');
        e.currentTarget.classList.add('active');

        if (targetScreenId === 'movies-screen') {
            renderAllMovies();
        } else if (targetScreenId === 'series-screen') {
            renderAllSeries();
        } else if (targetScreenId === 'profile-screen') {
            // Lógica para la pantalla de perfil
        } else if (targetScreenId === 'home-screen') {
            fetchHomeContent();
        }
    });
});

seeMoreButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        const endpoint = e.currentTarget.getAttribute('data-endpoint');
        const type = e.currentTarget.getAttribute('data-type');
        
        showLoader();
        try {
            const items = await fetchFromTMDB(endpoint);
            if (type === 'movie') {
                renderGrid(allMoviesGrid, items, 'movie');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                moviesScreen.classList.add('active');
            } else {
                renderGrid(allSeriesGrid, items, 'tv');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                seriesScreen.classList.add('active');
            }
        } catch (error) {
            console.error("Error loading 'See more' content:", error);
            alert('No se pudo cargar el contenido. Intenta de nuevo.');
        } finally {
            hideLoader();
        }
    });
});

genresButton.addEventListener('click', () => {
    renderGenresModal('movie');
    showModal(genresModal);
});
seriesGenresButton.addEventListener('click', () => {
    renderGenresModal('tv');
    showModal(genresModal);
});

async function renderAllMovies() {
    showLoader();
    try {
        const movies = await fetchFromTMDB('discover/movie?sort_by=popularity.desc');
        renderGrid(allMoviesGrid, movies, 'movie');
    } catch (error) {
        console.error("Error rendering all movies:", error);
        alert('No se pudieron cargar las películas. Intenta de nuevo.');
    } finally {
        hideLoader();
    }
}

async function renderAllSeries() {
    showLoader();
    try {
        const series = await fetchFromTMDB('discover/tv?sort_by=popularity.desc');
        renderGrid(allSeriesGrid, series, 'tv');
    } catch (error) {
        console.error("Error rendering all series:", error);
        alert('No se pudieron cargar las series. Intenta de nuevo.');
    } finally {
        hideLoader();
    }
}

// --- Funcionalidad de Favoritos (NUEVO) ---
async function addToFavorites(movie) {
    if (!auth.currentUser) {
        alert('Debes iniciar sesión para guardar favoritos.');
        return;
    }
    try {
        await addDoc(collection(db, "favorites"), {
            userId: auth.currentUser.uid,
            tmdbId: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            type: movie.media_type || 'movie'
        });
        alert('Añadido a Mi lista');
    } catch (e) {
        console.error("Error adding favorite: ", e);
        alert('No se pudo añadir a la lista.');
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
    await fetchAllGenres('movie');
    await fetchAllGenres('tv');
    fetchHomeContent();
});
