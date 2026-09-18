import React from 'react';

export default function Loader({ message = 'Cargando...' }) {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="spinner" />
      <p className="loader-message">{message}</p>
    </div>
  );
}
