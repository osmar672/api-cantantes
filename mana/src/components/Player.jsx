import React from 'react';
import { getYouTubeEmbedById, getYouTubeSearchUrl } from '../services/api';

export default function Player({
  track,
  artistName,
  videoId,
  loading,
  error,
  onClose,
}) {
  if (!track) return null;

  const embedUrl = videoId ? getYouTubeEmbedById(videoId) : null;
  const searchUrl = getYouTubeSearchUrl(artistName, track.title);

  return (
    <div className="player-bar" role="region" aria-label="Reproductor">
      <div className="player-inner">
        <div className="player-visual">
          <div className={`eq-bars ${videoId && !loading ? 'active' : ''}`} aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="player-meta">
            <p className="player-now">
              {loading ? 'Buscando video...' : error ? 'No disponible' : 'Reproduciendo'}
            </p>
            <p className="player-title">{track.title}</p>
            <p className="player-artist">{artistName}</p>
          </div>
        </div>

        <div className="player-embed-wrap">
          {loading && (
            <div className="player-status">Buscando en YouTube...</div>
          )}
          {!loading && error && (
            <div className="player-status player-status-error">
              <span>{error}</span>
              <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                Abrir busqueda
              </a>
            </div>
          )}
          {!loading && videoId && (
            <iframe
              key={videoId}
              title={`Video: ${track.title} - ${artistName}`}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="player-iframe"
            />
          )}
        </div>

        <button
          type="button"
          className="player-close"
          onClick={onClose}
          aria-label="Cerrar reproductor"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
