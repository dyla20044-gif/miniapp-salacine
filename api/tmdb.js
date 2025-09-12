import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { endpoint, query } = req.query;
  const API_KEY = process.env.TMDB_API_KEY;

  if (!API_KEY) {
    console.error('TMDB_API_KEY no está configurada.');
    return res.status(500).json({ error: 'TMDB_API_KEY no está configurada.' });
  }

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint es requerido.' });
  }

  const url = query
    ? `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`
    : `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=es-ES`;
  
  const finalUrl = url.includes('?') ? url.replace('?', '&') : url;

  console.log('Final API URL:', finalUrl);

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) {
      console.error(`Error de la API de TMDb: ${response.status}`);
      throw new Error(`Error de la API de TMDb: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
