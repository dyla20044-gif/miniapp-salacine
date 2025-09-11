import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = '5eb8461b85d0d88c46d77cfe5436291f'; // Tu API de TMDb
  const TMDB_URL = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(TMDB_URL);
    if (!response.ok) {
      throw new Error('Error al buscar en TMDb');
    }
    const data = await response.json();
    res.status(200).json(data.results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
