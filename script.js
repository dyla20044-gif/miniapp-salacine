import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuración de Firebase ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(__firebase_config);

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

let moviesData = [];
let userId = null;

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
    movieCard.innerHTML = `<img src="${movie.poster}" alt="${movie.title}" class="movie-poster">`;
    movieCard.addEventListener('click', () => {
        if (movie.isPremium) {
            showModal(premiumModal);
        } else {
            showMovieDetails(movie);
        }
    });
    return movieCard;
}

function renderMovies(movies) {
    const tiroteosContainer = document.getElementById('tiroteos-movies');
    const popularesContainer = document.getElementById('populares-movies');
    const terrorContainer = document.getElementById('terror-movies');

    tiroteosContainer.innerHTML = '';
    popularesContainer.innerHTML = '';
    terrorContainer.innerHTML = '';

    const bannerMovie = movies.find(movie => movie.category === 'banner');
    if (bannerMovie && bannerMovie.banner) {
        heroBanner.style.backgroundImage = `url('${bannerMovie.banner}')`;
        heroBanner.addEventListener('click', () => {
            if (bannerMovie.isPremium) {
                showModal(premiumModal);
            } else {
                showMovieDetails(bannerMovie);
            }
        });
    }

    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        if (movie.category === 'tiroteos') {
            tiroteosContainer.appendChild(movieCard);
        } else if (movie.category === 'populares') {
            popularesContainer.appendChild(movieCard);
        } else if (movie.category === 'terror') {
            terrorContainer.appendChild(movieCard);
        }
    });
}

function showMovieDetails(movie) {
    document.getElementById('modal-poster').src = movie.poster;
    document.getElementById('modal-poster').alt = movie.title;
    document.getElementById('modal-title').textContent = movie.title;
    document.getElementById('modal-description').textContent = movie.description;
    document.getElementById('trailer-button').href = movie.trailerLink;

    const watchButton = document.getElementById('watch-button');
    watchButton.onclick = () => {
        if (movie.videoLink) {
            videoPlayer.src = movie.videoLink;
            showModal(videoModal);
            videoPlayer.play();
        } else {
            alert('No hay enlace de video disponible para esta película.');
        }
    };
    showModal(movieModal);
}

// Lógica de Búsqueda
searchIconTop.addEventListener('click', () => {
    if (searchResultsSection.style.display === 'none' || searchResultsSection.style.display === '') {
        movieCatalog.style.display = 'none';
        searchResultsSection.style.display = 'block';
        searchInput.value = '';
        searchInput.focus();
    } else {
        movieCatalog.style.display = 'block';
        searchResultsSection.style.display = 'none';
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    searchResultsList.innerHTML = '';
    if (query.length > 0) {
        const filteredMovies = moviesData.filter(movie => 
            movie.title.toLowerCase().includes(query) || movie.description.toLowerCase().includes(query)
        );
        if (filteredMovies.length > 0) {
            filteredMovies.forEach(movie => {
                searchResultsList.appendChild(createMovieCard(movie));
            });
        } else {
            searchResultsList.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">No se encontraron resultados.</p>';
        }
    }
});

// --- Inicialización y Carga de Datos ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
    } else {
        await signInAnonymously(auth);
    }
    fetchMovies();
});

function fetchMovies() {
    const moviesColRef = collection(db, 'artifacts', appId, 'public', 'data', 'movies');
    onSnapshot(moviesColRef, (snapshot) => {
        moviesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderMovies(moviesData);
    });
}