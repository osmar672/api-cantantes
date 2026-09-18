import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ArtistSelector from './components/ArtistSelector';
import SearchBar from './components/SearchBar';
import Card from './components/Card';
import Pagination from './components/Pagination';
import Loader from './components/Loader';
import Modal from './components/Modal';
import Player from './components/Player';
import {
  ARTISTS,
  getReleaseGroups,
  getReleaseGroupDetail,
  getReleaseWithTracks,
  pickBestRelease,
  extractTracks,
  rankAlbums,
  searchYouTubeVideoId,
} from './services/api';
import './styles/App.css';

const LIMIT = 50;
const TOP_ALBUMS_COUNT = 5;
const TOP_SONGS_COUNT = 10;

export default function App() {
  const [artistKey, setArtistKey] = useState('mac');
  const [releaseGroups, setReleaseGroups] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [topSongs, setTopSongs] = useState([]);
  const [topSongsLoading, setTopSongsLoading] = useState(false);
  const [topSongsAlbumTitle, setTopSongsAlbumTitle] = useState('');

  const [selectedRG, setSelectedRG] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Reproductor en la misma pagina
  const [nowPlaying, setNowPlaying] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const artist = ARTISTS[artistKey];

  useEffect(() => {
    document.body.classList.remove(
      'theme-mac',
      'theme-jose',
      'theme-rock',
      'theme-laferte',
      'theme-arjona'
    );
    document.body.classList.add(`theme-${artist.theme}`);
  }, [artist.theme]);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTopSongs([]);
    setTopSongsAlbumTitle('');
    try {
      await new Promise((r) => setTimeout(r, 300));
      const data = await getReleaseGroups(artist.id, LIMIT, offset);
      setReleaseGroups(data['release-groups'] || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(err.message || 'Error al cargar los albumes');
      setReleaseGroups([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [artist.id, offset]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const topAlbums = useMemo(() => {
    if (searchTerm.trim()) return [];
    return rankAlbums(releaseGroups).slice(0, TOP_ALBUMS_COUNT);
  }, [releaseGroups, searchTerm]);

  useEffect(() => {
    if (!topAlbums.length || searchTerm.trim() || offset !== 0) {
      setTopSongs([]);
      setTopSongsAlbumTitle('');
      return;
    }

    let cancelled = false;

    async function loadTopSongs() {
      setTopSongsLoading(true);
      try {
        const firstAlbum = topAlbums[0];
        await new Promise((r) => setTimeout(r, 400));
        const rgData = await getReleaseGroupDetail(firstAlbum.id);
        if (cancelled) return;

        const best = pickBestRelease(rgData.releases || []);
        if (!best?.id) {
          setTopSongs([]);
          setTopSongsAlbumTitle(firstAlbum.title);
          return;
        }

        await new Promise((r) => setTimeout(r, 400));
        const releaseData = await getReleaseWithTracks(best.id);
        if (cancelled) return;

        const extracted = extractTracks(releaseData);
        const ranked = [...extracted]
          .map((t, idx) => {
            let score = 100 - idx * 3;
            const sec = (t.lengthMs || 0) / 1000;
            if (sec >= 150 && sec <= 280) score += 15;
            if (sec > 0 && sec < 90) score -= 10;
            return { ...t, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, TOP_SONGS_COUNT);

        setTopSongs(ranked);
        setTopSongsAlbumTitle(firstAlbum.title);
      } catch {
        if (!cancelled) {
          setTopSongs([]);
          setTopSongsAlbumTitle('');
        }
      } finally {
        if (!cancelled) setTopSongsLoading(false);
      }
    }

    loadTopSongs();
    return () => {
      cancelled = true;
    };
  }, [topAlbums, searchTerm, offset]);

  const handleArtistChange = (key) => {
    setArtistKey(key);
    setOffset(0);
    setSearchTerm('');
    setSelectedRG(null);
    setTopSongs([]);
    setTopSongsAlbumTitle('');
    setNowPlaying(null);
    setVideoId(null);
    setPlayerLoading(false);
    setPlayerError(null);
  };

  const filtered = releaseGroups.filter((rg) =>
    rg.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const playTrack = async (track) => {
    setNowPlaying(track);
    setVideoId(null);
    setPlayerError(null);
    setPlayerLoading(true);
    try {
      const id = await searchYouTubeVideoId(artist.name, track.title);
      setVideoId(id);
    } catch {
      setPlayerError('No se encontro un video reproducible');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleCardClick = async (rg) => {
    setSelectedRG(rg);
    setDetail(null);
    setTracks([]);
    setDetailError(null);
    setDetailLoading(true);
    setTracksLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 350));
      const rgData = await getReleaseGroupDetail(rg.id);
      setDetail(rgData);
      setDetailLoading(false);

      const best = pickBestRelease(rgData.releases || []);
      if (best?.id) {
        await new Promise((r) => setTimeout(r, 350));
        const releaseData = await getReleaseWithTracks(best.id);
        setTracks(extractTracks(releaseData));
      } else {
        setTracks([]);
      }
    } catch (err) {
      setDetailError(err.message || 'No se pudieron cargar los detalles');
      setDetailLoading(false);
    } finally {
      setTracksLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedRG(null);
    setDetail(null);
    setTracks([]);
    setDetailError(null);
  };

  return (
    <div className={`app ${nowPlaying ? 'has-player' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">MusicBrainz Explorer</h1>
          <p className="app-subtitle">
            Explora la discografia de {artist.name}
          </p>
        </div>
        <ArtistSelector selected={artistKey} onChange={handleArtistChange} />
      </header>

      <main className="app-main">
        <div className="toolbar">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        {loading && <Loader message="Cargando albumes desde MusicBrainz..." />}

        {error && (
          <div className="error-banner" role="alert">
            <p>{error}</p>
            <button type="button" onClick={fetchAlbums}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {topAlbums.length > 0 && (
              <section className="top-section">
                <h2 className="section-title">Top albumes</h2>
                <p className="section-desc">
                  Ranking por relevancia en MusicBrainz (tipo, reediciones).
                </p>
                <div className="cards-grid top-grid">
                  {topAlbums.map((rg, idx) => (
                    <Card
                      key={`top-${rg.id}`}
                      releaseGroup={rg}
                      onClick={handleCardClick}
                      rank={idx + 1}
                    />
                  ))}
                </div>
              </section>
            )}

            {(topSongsLoading || topSongs.length > 0) &&
              !searchTerm.trim() &&
              offset === 0 && (
                <section className="top-songs-section">
                  <h2 className="section-title">Top canciones</h2>
                  <p className="section-desc">
                    {topSongsAlbumTitle
                      ? `Destacadas de "${topSongsAlbumTitle}"`
                      : 'Canciones destacadas'}
                    . Pulsa Reproducir para escuchar en esta pagina (via YouTube).
                  </p>

                  {topSongsLoading ? (
                    <Loader message="Cargando top de canciones..." />
                  ) : (
                    <ol className="top-songs-main-list">
                      {topSongs.map((track, idx) => (
                        <li key={track.id}>
                          <span className="track-rank">{idx + 1}</span>
                          <div className="track-info">
                            <span className="track-title">{track.title}</span>
                            {topSongsAlbumTitle && (
                              <span className="track-album">
                                {topSongsAlbumTitle}
                              </span>
                            )}
                          </div>
                          <span className="track-duration">{track.duration}</span>
                          <button
                            type="button"
                            className={`play-btn play-inline ${
                              nowPlaying?.id === track.id ? 'playing' : ''
                            }`}
                            onClick={() => playTrack(track)}
                          >
                            {nowPlaying?.id === track.id ? 'Sonando' : 'Reproducir'}
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

            <section className="all-section">
              <h2 className="section-title">
                {searchTerm
                  ? 'Resultados de busqueda'
                  : `Todos los albumes (${totalCount})`}
              </h2>

              {filtered.length === 0 ? (
                <p className="empty-state">
                  {searchTerm
                    ? `No se encontraron albumes que coincidan con "${searchTerm}"`
                    : 'No hay albumes para mostrar.'}
                </p>
              ) : (
                <div className="cards-grid">
                  {filtered.map((rg) => (
                    <Card
                      key={rg.id}
                      releaseGroup={rg}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              )}

              <Pagination
                offset={offset}
                limit={LIMIT}
                total={totalCount}
                onPageChange={setOffset}
                loading={loading}
              />
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Datos de{' '}
          <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">
            MusicBrainz
          </a>
          . El audio se reproduce con busqueda embebida de YouTube (sin API key).
        </p>
      </footer>

      {selectedRG && (
        <Modal
          releaseGroup={selectedRG}
          detail={detail}
          tracks={tracks}
          tracksLoading={tracksLoading}
          loading={detailLoading}
          error={detailError}
          artistName={artist.name}
          nowPlayingId={nowPlaying?.id}
          onPlay={playTrack}
          onClose={closeModal}
        />
      )}

      <Player
        track={nowPlaying}
        artistName={artist.name}
        videoId={videoId}
        loading={playerLoading}
        error={playerError}
        onClose={() => {
          setNowPlaying(null);
          setVideoId(null);
          setPlayerLoading(false);
          setPlayerError(null);
        }}
      />
    </div>
  );
}
