import React from 'react';
import { ARTISTS } from '../services/api';

const ORDER = ['mac', 'jose', 'alejandra', 'mon', 'arjona'];

export default function ArtistSelector({ selected, onChange }) {
  return (
    <div className="artist-selector">
      <label htmlFor="artist-select" className="artist-label">
        Artista
      </label>
      <select
        id="artist-select"
        className="artist-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {ORDER.map((key) => (
          <option key={key} value={key}>
            {ARTISTS[key].name}
          </option>
        ))}
      </select>
    </div>
  );
}
