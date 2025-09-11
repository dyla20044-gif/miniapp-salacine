import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { endpoint, query } = req.query;
  const API_KEY = process.env.TMDB_API_KEY; // Esta es la línea clave

  if (!API_KEY) {
    return res.status(500).json({ error: 'La clave de API de TMDb no está configurada.' });
  }

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint es requerido' });
  }

  const url = query 
    ? `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`
    : `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=es-ES`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error de la API: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
