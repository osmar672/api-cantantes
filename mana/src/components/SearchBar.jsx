import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Buscar álbum por título...' }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar álbumes"
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          x
        </button>
      )}
    </div>
  );
}
