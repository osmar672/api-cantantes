import React, { useEffect } from 'react';
import { getCoverArtUrl } from '../services/api';

export default function Modal({
  releaseGroup,
  detail,
  tracks,
  tracksLoading,
  loading,
  error,
  artistName = '',
  nowPlayingId,
  onPlay,
  onClose,
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!releaseGroup) return null;

  const coverUrl = getCoverArtUrl(releaseGroup.id);
  const year = releaseGroup['first-release-date'] || 'Desconocida';
  const genres =
    detail?.genres?.map((g) => g.name).join(', ') ||
    detail?.tags?.slice(0, 5).map((t) => t.name).join(', ') ||
    'No disponibles';
  const artists =
    detail?.['artist-credit']?.map((ac) => ac.name || ac.artist?.name).join(', ') ||
    artistName ||
    '—';

  const firstRelease = detail?.releases?.[0];
  const label =
    firstRelease?.['label-info']?.[0]?.label?.name ||
    firstRelease?.['release-events']?.[0]?.area?.name ||
    'No disponible';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          x
        </button>

        <div className="modal-header">
          <div className="modal-cover">
            <img
              src={coverUrl}
              alt={`Portada de ${releaseGroup.title}`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="modal-cover-fallback" style={{ display: 'none' }}>
              Sin portada
            </div>
          </div>
          <div className="modal-info">
            <h2>{releaseGroup.title}</h2>
            <p className="modal-meta">
              <strong>Artista:</strong> {artists}
            </p>
            <p className="modal-meta">
              <strong>Fecha:</strong> {year}
            </p>
            <p className="modal-meta">
              <strong>Tipo:</strong> {releaseGroup['primary-type'] || 'Álbum'}
            </p>
            <p className="modal-meta">
              <strong>Generos / Tags:</strong> {genres}
            </p>
            <p className="modal-meta">
              <strong>Sello / Origen:</strong> {label}
            </p>
          </div>
        </div>

        <div className="modal-body">
          {loading && <p className="modal-loading">Cargando detalles...</p>}
          {error && <p className="modal-error">{error}</p>}

          {!loading && !error && (
            <section className="tracks-section">
              <h3>Lista de canciones ({tracks?.length || 0})</h3>
              {tracksLoading ? (
                <p className="modal-loading">Cargando lista completa...</p>
              ) : tracks && tracks.length > 0 ? (
                <ol className="full-tracklist">
                  {tracks.map((track) => (
                    <li key={track.id}>
                      <span className="track-pos">{track.position}</span>
                      <span className="track-title">{track.title}</span>
                      <span className="track-duration">{track.duration}</span>
                      <button
                        type="button"
                        className={`play-btn play-inline ${
                          nowPlayingId === track.id ? 'playing' : ''
                        }`}
                        onClick={() => onPlay?.(track)}
                      >
                        {nowPlayingId === track.id ? 'Sonando' : 'Reproducir'}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="no-tracks">
                  No hay lista de canciones disponible para este lanzamiento.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
