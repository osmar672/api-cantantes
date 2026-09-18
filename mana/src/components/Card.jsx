import React, { useState } from 'react';
import { getCoverArtUrl } from '../services/api';

export default function Card({ releaseGroup, onClick, rank }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = getCoverArtUrl(releaseGroup.id);
  const year =
    releaseGroup['first-release-date']?.slice(0, 4) ||
    releaseGroup['first-release-date'] ||
    '—';
  const type = releaseGroup['primary-type'] || 'Álbum';

  return (
    <article
      className="album-card"
      onClick={() => onClick(releaseGroup)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(releaseGroup);
        }
      }}
    >
      <div className="card-image-wrapper">
        {!imgError ? (
          <img
            src={coverUrl}
            alt={`Portada de ${releaseGroup.title}`}
            className="card-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-placeholder">
            <span>Sin portada</span>
          </div>
        )}
        {rank != null && <span className="card-rank">#{rank}</span>}
        <span className="card-type">{type}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title" title={releaseGroup.title}>
          {releaseGroup.title}
        </h3>
        <p className="card-year">{year}</p>
      </div>
    </article>
  );
}
