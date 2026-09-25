const GRAPH_URL = 'https://graph.instagram.com';

module.exports = async function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    's-maxage=900, stale-while-revalidate=1800'
  );

  res.setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Método no permitido.'
    });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return res.status(503).json({
      ok: false,
      error:
        'Falta configurar INSTAGRAM_ACCESS_TOKEN en las variables de entorno de Vercel.'
    });
  }

  try {
    const params = new URLSearchParams({
      fields:
        'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url}',
      limit: '12',
      access_token: token
    });

    const response = await fetch(
      `${GRAPH_URL}/me/media?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error:
          data?.error?.message ||
          'Instagram rechazó la solicitud.'
      });
    }

    const media = Array.isArray(data.data)
      ? data.data
      : [];

    const normalized = media.map(item => {
      let mediaUrl = item.media_url || null;
      let thumbnailUrl = item.thumbnail_url || null;

      if (
        item.media_type === 'CAROUSEL_ALBUM' &&
        !mediaUrl &&
        Array.isArray(item.children?.data)
      ) {
        const firstChild =
          item.children.data.find(
            child =>
              child.media_url ||
              child.thumbnail_url
          );

        mediaUrl =
          firstChild?.media_url || null;

        thumbnailUrl =
          firstChild?.thumbnail_url || null;
      }

      return {
        id: item.id,
        caption: item.caption || '',
        media_type: item.media_type,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        permalink: item.permalink || '',
        timestamp: item.timestamp || null
      };
    });

    return res.status(200).json({
      ok: true,
      data: normalized
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error:
        'No se pudo conectar con Instagram en este momento.'
    });
  }
};