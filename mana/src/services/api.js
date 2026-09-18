const BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_BASE = 'https://coverartarchive.org/release-group';

const USER_AGENT = 'MusicBrainzExplorerLab/1.0.0 ( laboratorio-uni@ejemplo.com )';

const ARTISTS = {
  mac: {
    id: 'f2492c31-54a8-4347-a1fc-f81f72873bbf',
    name: 'Mac DeMarco',
    theme: 'mac',
  },
  jose: {
    id: '4f4a0d43-75d4-4c31-8d0d-c48e4c0efbf9',
    name: 'José José',
    theme: 'jose',
  },
  alejandra: {
    id: '618bf47d-48ff-4aec-8d82-435b93dcca76',
    name: 'Alejandra Guzmán',
    theme: 'rock',
  },
  mon: {
    id: 'ab966c0f-e526-46ae-b492-82c27b87f81f',
    name: 'Mon Laferte',
    theme: 'laferte',
  },
  arjona: {
    id: '40627299-0979-45ba-8924-2af5fdc36ea8',
    name: 'Ricardo Arjona',
    theme: 'arjona',
  },
};

async function musicBrainzFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('fmt', 'json');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 503 || response.status === 429) {
      throw new Error(
        'Rate limit alcanzado o servicio temporalmente no disponible. Espera unos segundos e intenta de nuevo.'
      );
    }
    throw new Error(`Error de MusicBrainz: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getReleaseGroups(artistId, limit = 50, offset = 0) {
  return musicBrainzFetch('/release-group', {
    artist: artistId,
    type: 'album|ep',
    limit,
    offset,
  });
}

export async function getReleaseGroupDetail(releaseGroupId) {
  return musicBrainzFetch(`/release-group/${releaseGroupId}`, {
    inc: 'releases+artists+genres+tags',
  });
}

export async function getReleaseWithTracks(releaseId) {
  return musicBrainzFetch(`/release/${releaseId}`, {
    inc: 'recordings+artist-credits+media+labels',
  });
}

export function pickBestRelease(releases = []) {
  if (!releases.length) return null;
  const scored = releases.map((r) => {
    let score = 0;
    if (r.status === 'Official') score += 10;
    if (['XW', 'US', 'GB', 'MX', 'ES', 'CL', 'GT', 'AR'].includes(r.country)) score += 3;
    if (r.media?.length) score += 5;
    if (r['track-count']) score += Math.min(r['track-count'], 20);
    return { release: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].release;
}

export function extractTracks(release) {
  if (!release?.media?.length) return [];
  const tracks = [];
  let globalPos = 1;
  release.media.forEach((medium, mediumIndex) => {
    (medium.tracks || []).forEach((t) => {
      const lengthMs = t.length || t.recording?.length;
      const minutes = lengthMs ? Math.floor(lengthMs / 60000) : null;
      const seconds = lengthMs ? Math.floor((lengthMs % 60000) / 1000) : null;
      const duration =
        minutes !== null
          ? `${minutes}:${String(seconds).padStart(2, '0')}`
          : '—';
      tracks.push({
        id: t.id || t.recording?.id || `${mediumIndex}-${t.number}`,
        position: t.number || String(globalPos),
        title: t.title || t.recording?.title || 'Sin título',
        duration,
        lengthMs: lengthMs || 0,
      });
      globalPos += 1;
    });
  });
  return tracks;
}

export function scoreAlbum(rg) {
  let score = 0;
  const type = (rg['primary-type'] || '').toLowerCase();
  if (type === 'album') score += 30;
  if (type === 'ep') score += 10;
  const secondary = rg['secondary-types'] || [];
  if (secondary.some((s) => /live|compilation|remix/i.test(s))) score -= 15;
  const count = rg['release-count'] || 0;
  score += Math.min(count * 3, 25);
  const year = parseInt((rg['first-release-date'] || '9999').slice(0, 4), 10);
  if (!Number.isNaN(year) && year < 2000) score += 8;
  if (!Number.isNaN(year) && year < 1990) score += 5;
  return score;
}

export function rankAlbums(releaseGroups) {
  return [...releaseGroups].sort((a, b) => scoreAlbum(b) - scoreAlbum(a));
}

/**
 * Busca el videoId en instancias publicas (Piped) para poder embeber
 * el video real en la misma pagina. Sin API key de YouTube.
 */
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.leptons.xyz',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.r4fo.com',
  'https://pipedapi.darkness.services',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.materialio.us',
  'https://yt.artemislena.eu',
];

export async function searchYouTubeVideoId(artistName, trackTitle) {
  const q = `${artistName} ${trackTitle}`;
  let lastError = null;

  // 1) Piped
  for (const base of PIPED_INSTANCES) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(q)}&filter=videos`;
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.items || [];
      for (const item of items) {
        if (item.type && item.type !== 'stream' && item.type !== 'video') continue;
        let id = item.id || item.videoId;
        if (!id && item.url) {
          const match = String(item.url).match(/(?:v=|\/watch\/|\/)([\w-]{11})(?:[&#?]|$)/);
          id = match?.[1];
        }
        if (id && /^[\w-]{11}$/.test(id)) return id;
      }
      lastError = new Error('Sin resultados');
    } catch (err) {
      lastError = err;
    }
  }

  // 2) Invidious
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      for (const item of items) {
        const id = item.videoId || item.id;
        if (id && /^[\w-]{11}$/.test(id)) return id;
      }
      lastError = new Error('Sin resultados');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo encontrar el video');
}

export function getYouTubeEmbedById(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

export function getYouTubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeSearchUrl(artistName, trackTitle) {
  const q = encodeURIComponent(`${artistName} ${trackTitle}`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export function getSpotifySearchUrl(artistName, trackTitle) {
  const q = encodeURIComponent(`${artistName} ${trackTitle}`);
  return `https://open.spotify.com/search/${q}`;
}

export function getCoverArtUrl(releaseGroupId) {
  return `${COVER_ART_BASE}/${releaseGroupId}/front-250`;
}

export { ARTISTS, USER_AGENT };
