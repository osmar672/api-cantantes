# MusicBrainz Explorer

SPA en React + Vite que explora la discografía de **Mac DeMarco** y **José José** usando la API pública de MusicBrainz.

## Características

- Selector de artista con temas visuales distintos (indie/slacker vs. clásico/romántico)
- Listado de álbumes y EPs en tarjetas con portadas (Cover Art Archive)
- Buscador local por título
- Paginación con `limit` / `offset`
- Modal de detalle con géneros, sellos y lanzamientos asociados
- Manejo de estados de carga y errores (incluyendo rate-limit)
- Componentes reutilizables

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

## Instalación y ejecución

```bash
# 1. Descomprimir el ZIP y entrar a la carpeta
cd musicbrainz-explorer

# 2. Instalar dependencias
npm install

# 3. Arrancar en modo desarrollo
npm run dev
```

Abre la URL que muestra Vite (normalmente http://localhost:5173).

## Scripts disponibles

| Comando          | Descripción              |
|------------------|--------------------------|
| `npm run dev`    | Servidor de desarrollo   |
| `npm run build`  | Build de producción      |
| `npm run preview`| Previsualizar el build   |

## Estructura del proyecto

```
src/
├── components/
│   ├── ArtistSelector.jsx
│   ├── Card.jsx
│   ├── Loader.jsx
│   ├── Modal.jsx
│   ├── Pagination.jsx
│   └── SearchBar.jsx
├── services/
│   └── api.js          # Llamadas a MusicBrainz + headers
├── styles/
│   └── App.css         # Temas y estilos
├── App.jsx
├── main.jsx
└── index.css
```

## API utilizada

- **Base:** https://musicbrainz.org/ws/2
- **User-Agent obligatorio:** `MusicBrainzExplorerLab/1.0.0 ( laboratorio-uni@ejemplo.com )`
- **Portadas:** https://coverartarchive.org/release-group/{id}/front-250

### Endpoints

1. Listado de Release Groups:
   `GET /release-group?artist={MBID}&type=album|ep&limit=12&offset=0&fmt=json`

2. Detalle:
   `GET /release-group/{id}?inc=releases+artists+genres+tags&fmt=json`

## Notas importantes

- MusicBrainz impone un límite de **≈ 1 petición por segundo**. La app incluye pequeños delays para respetarlo.
- Si recibes errores 503/429, espera unos segundos y reintenta.
- Las portadas no siempre existen; en ese caso se muestra un placeholder.

## Créditos

Datos © MusicBrainz contributors · Portadas © Cover Art Archive
