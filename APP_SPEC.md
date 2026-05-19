# Warhammer Quick Rules — Spec funcional

Documento de referencia de qué hace la app iOS hoy. Sirve como base para la migración a PWA.

---

## 1. Resumen

App iOS (SwiftUI, iOS 17+, solo iPhone) para jugar partidas de **Warhammer Age of Sigmar – Spearhead**. Cumple dos funciones:

1. **Catálogo de ejércitos (Spearheads):** lista navegable con detalles, reglas rápidas (imagen), PDF oficial, búsqueda, favoritos y marcado de "owned".
2. **Match Center:** gestionar jugadores y partidas, con tracking de puntaje por ronda y acceso rápido a las Quick Rules de los dos bandos en pantalla.

Toda la información se persiste **localmente** (sin backend propio). Los datos vienen bundleados como JSON + imágenes; opcionalmente se podrían rebajar desde un Google Sheet público.

---

## 2. Modelos de dominio

### `Army`
Un Spearhead. Campos:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String | Derivado de `faction::spearheadName`, normalizado (case/diacritic insensitive) |
| `faction` | String | Ej: "Blades of Khorne" |
| `spearheadName` | String | Ej: "Bloodbound Gore Pilgrims" |
| `grandAlliance` | String | Chaos / Order / Death / Destruction |
| `modelCount` | Int? | Cantidad de miniaturas |
| `pointsValue` | Int? | Puntos del Spearhead |
| `released` | Bool | Si ya salió oficialmente |
| `inPrint` | Bool | Si sigue en producción |
| `owned` | Bool | Flag inicial (override local con `ownedIDs`) |
| `details` | String | Lista de unidades en texto plano, con headers `GENERAL` / `UNITS` |
| `quickRulesFileName` | String? | Nombre legible |
| `thumbnailImageName` | String? | Nombre del archivo en `OfflineData/ArmyThumbnails` |
| `quickRulesImageName` | String? | Nombre del archivo en `OfflineData/QuickRules` |
| `officialPDFURL` | URL? | Link oficial al PDF en warhammer-community.com |
| `imageURL` | URL? | Fallback si no hay thumbnail bundleado |

### `PlayerProfile`
- `id: UUID`, `name: String`, `isPrimaryUser: Bool` (solo uno true a la vez).
- Default: se crea un jugador `"Manu"` marcado como primary user si no existe ninguno.

### `MatchRecord`
- `id: UUID`, `playerOneID/playerTwoID: UUID`, `playerOneArmyID/playerTwoArmyID: String`
- `rounds: [MatchRoundScore]` (default: 4 rondas inicializadas en 0)
- `createdAt`, `updatedAt`
- Totales calculados: suma de puntos por jugador

### `MatchRoundScore`
- `roundNumber: Int`, `playerOnePoints: Int`, `playerTwoPoints: Int`

---

## 3. Origen de datos

- **Bundleado (camino feliz):** `OfflineData/armies.json` (~48 ejércitos), `OfflineData/ArmyThumbnails/*.jpg` y `OfflineData/QuickRules/*.png` empaquetados con la app.
- **Fallback online:** si no está el JSON bundleado, scrapea HTML de un Google Sheets público:
  `https://docs.google.com/spreadsheets/d/12yiSFPhptA95R7Gihxq3g5HMJvjdwm9AsSHO2RxXKBo/edit?gid=0#gid=0`
  Parsea la tabla con regex sobre `<tr>/<td>` y extrae también una mapa de PDFs oficiales con otra regex sobre el JSON embebido.

> En la práctica, la app siempre carga del JSON bundleado. El scraper es un legacy/seed.

---

## 4. Persistencia local

Todo en `UserDefaults` (clave → tipo):

| Clave | Tipo | Para qué |
|---|---|---|
| `favorite_army_ids` | `[String]` | IDs marcados como favoritos (pin) |
| `owned_army_ids` | `[String]` | IDs marcados como "owned" |
| `match_player_profiles` | JSON `[PlayerProfile]` | Lista de jugadores |
| `match_records` | JSON `[MatchRecord]` | Historial de partidas |

---

## 5. UI / Flujos

Arquitectura: `TabView` con dos tabs — **Armies** y **Matches**.

### 5.1 Tab Armies

**Lista (`ArmyListView`):**
- Cards grandes con thumbnail, nombre del spearhead, facción, grand alliance, puntos.
- Badges: pin (favorito) y check (owned).
- Búsqueda por facción/spearhead/grand alliance/details (case + diacritic insensitive).
- Toggle "solo favoritos" en toolbar.
- Pull-to-refresh recarga del repo.
- Contador de resultados en toolbar.
- Swipe izquierda → toggle favorito (pin). Swipe derecha → toggle owned.
- Orden: favoritos primero → owned → alfabético por facción → spearhead.

**Detalle (`ArmyDetailView`):**
- Hero image arriba (thumbnail o async).
- Título + botones pin/owned.
- Sección **Rules**: lista de unidades, renderiza `GENERAL` y `UNITS` como headers en mayúscula subrayados.
- Sección **Official PDF**: botones "Open PDF" (link externo) y "Share" (ShareLink).
- Sección **Quick Rules**: imagen bundleada; tap → fullscreen con pinch-zoom (1×–6×), drag para pan, doble-tap toggle 1×/2×.

### 5.2 Tab Matches (`MatchCenterView`)

**Lista principal:**
- Sección **Players**: lista de jugadores con badge "You" para el primary. Botón "Add Player".
- Sección **Battles**: botón "New Battle" + historial de partidas (ordenado por `updatedAt` desc).
- Cada partida muestra: `Player1 vs Player2`, score `X - Y`, nombres de los ejércitos, timestamp.
- Swipe izquierda → eliminar.

**New Player sheet:** TextField + Save / Cancel.

**New Match sheet:**
- 2 pickers de jugadores (excluye al ya seleccionado en el otro slot).
- 2 selectores de ejército que abren un `ArmyPickerSheet` con search.
- Default: Player 1 = primary user, Player 2 = primer otro disponible. Ejércitos = primeros 2 priorizados (fav > owned > alfabético).
- Botón "Create" deshabilitado hasta tener todo válido.

**Match detail (`MatchDetailView`):**
- Header con score total de cada jugador.
- Lista de rondas: cada ronda tiene 2 stepper (`–`/número/`+`) para puntos.
- Botón "Add Round" agrega una ronda al final.
- Sección Quick Rules: card por jugador con la imagen del ejército, tap → fullscreen zoom (mismo gesto que en Army detail).
- Toolbar: botón eliminar partida.

---

## 6. Estilos visuales

Paleta hardcoded en SwiftUI:

- Fondo principal **burgundy**: `Color(red: 0.27, green: 0.06, blue: 0.09)` → `#451017`
- Cards **navy**: `Color(red: 0.10, green: 0.17, blue: 0.29)` → `#1A2B4A`
- Texto blanco con varias opacidades (0.65, 0.72, 0.78, 0.92, 1.0).
- Acentos: naranja (pin), verde (owned).
- Corner radius generoso (14–24px), shadows suaves.
- Tipografía system (headline / title3 / subhead / caption).

---

## 7. Assets bundleados

- `OfflineData/armies.json` — ~48 ejércitos, ~36KB
- `OfflineData/ArmyThumbnails/*.jpg` — 48 thumbnails
- `OfflineData/QuickRules/*.png` — 40 imágenes de reglas (no todas las facciones tienen)
- Iconos de app en `Assets.xcassets/AppIcon.appiconset/`

---

## 8. Lo que NO hace la app (importante para alinear scope de la PWA)

- No hay backend propio ni sincronización entre dispositivos.
- No hay auth.
- No edita reglas; las Quick Rules son imágenes estáticas.
- No tiene timer de turno ni dados.
- No exporta/importa partidas.
- No tiene modo iPad/landscape (target solo iPhone).
- No tiene notificaciones.

---

## 9. Migración a PWA — plan

### Stack (decidido)
- **Framework:** Vite + React + TypeScript.
- **Estilos:** Tailwind con la paleta burgundy/navy custom.
- **Estado:** Zustand para `armies` + `favorites/owned` + `players/matches`. Persistencia en `localStorage` (con middleware `zustand/persist`).
- **Routing:** React Router. Dos vistas top-level: `/armies` y `/matches` + detalle anidado.
- **Imágenes/datos:** servidos desde `/public/data/` (mismo layout que `OfflineData/`).
- **Quick Rules zoom:** `react-zoom-pan-pinch`.
- **PWA tooling:** `vite-plugin-pwa` (wrappea Workbox).

### Estrategia de cache (decidido: precache total)

Al primer load, el Service Worker precachea **todo**:
- App shell (HTML/JS/CSS hasheado por Vite)
- `armies.json`
- `data-version.json`
- Todos los thumbnails (`/data/ArmyThumbnails/*.jpg`)
- Todas las Quick Rules (`/data/QuickRules/*.png`)

Tamaño aproximado: el bundle iOS pesa ~varios MB en assets; en web debería ser similar. Aceptable para una app de uso personal.

Estrategias runtime:
- App shell: precache + `skipWaiting` con confirmación de usuario.
- `armies.json` y `data-version.json`: `StaleWhileRevalidate` (devuelve cache, refresca en background).
- Imágenes: `CacheFirst` (no cambian salvo update).

### Update checking (decidido: SW + data-version manifest)

**Dos capas independientes:**

#### Capa A — Updates de código (Workbox automático)
- En `main.tsx`, registrar el SW vía `vite-plugin-pwa` con `registerSW({ onNeedRefresh, onOfflineReady })`.
- Cuando hay versión nueva del SW (cualquier cambio en el bundle de Vite), `onNeedRefresh` dispara → mostrar un toast persistente *"Nueva versión disponible"* con botón **Actualizar**.
- Click → `updateSW(true)` → `skipWaiting` + reload.

#### Capa B — Updates de datos (`data-version.json`)
- Archivo en `public/data/data-version.json`:
  ```json
  {
    "version": "2026-05-19",
    "armiesHash": "sha256-...",
    "armyCount": 48
  }
  ```
- Generado por un script de build (`scripts/build-data-version.mjs`) que hashea `armies.json` con sha256 y escribe el manifest. Corre antes de `vite build`.
- En la app, un `useDataVersion()` hook:
  - Al montar la app + cada N minutos (ej: cada 30 min con visibility change), hace `fetch('/data/data-version.json', { cache: 'no-store' })`.
  - Compara `version` con el último visto (guardado en `localStorage.lastSeenDataVersion`).
  - Si difiere → invalida cache de `armies.json` (cache API) + re-fetch + toast *"Ejércitos actualizados"*.
- En **Settings** o algún rincón de la UI: mostrar `"Datos: v2026-05-19 · 48 ejércitos"` + botón **Buscar actualizaciones** que dispara el check manual.

> Nota: la Capa B solo dispara cuando rehacés el JSON y redeployás. El laburo de mantener los datos al día sigue siendo manual (editar `armies.json`), pero al usuario le llega la actualización sin reinstalar.

### Otros PWA básicos
- `manifest.webmanifest` con iconos 192/512/maskable, `theme_color: "#451017"`, `background_color: "#451017"`, `display: "standalone"`.
- `apple-touch-icon` + meta viewport `viewport-fit=cover` para Add to Home Screen en iOS.
- Splash screens iOS (opcional; iOS los genera de `apple-touch-icon` si no se proveen).

### Mapeo Swift → Web

| Swift | Web |
|---|---|
| `@StateObject` ViewModel | Store (Zustand) o context |
| `UserDefaults` | `localStorage` (JSON.stringify) |
| `Bundle.main.url` para assets | `fetch('/data/...')` desde `/public/` |
| `AsyncImage` | `<img loading="lazy">` |
| `swipeActions` | Botones explícitos o lib de swipe (`react-swipeable-list`) |
| `fullScreenCover` + pinch | Modal + zoom-pan lib |
| `.searchable` | `<input>` controlado con filtro |
| `NavigationStack` | React Router stack |
| `ShareLink` | `navigator.share()` con fallback |
| `Link(destination: PDF)` | `<a href target=_blank>` |

### Fases

1. **Scaffold**: `npm create vite@latest` (React + TS) + Tailwind + React Router + Zustand + `vite-plugin-pwa` + `react-zoom-pan-pinch`. Copiar `WarhammerQuickRules/OfflineData/` → `public/data/`.
2. **Lista de ejércitos**: store + cards + búsqueda + favoritos/owned con `zustand/persist`.
3. **Detalle de ejército**: hero, reglas, PDF link, Quick Rules con zoom modal.
4. **Match Center**: store de players y matches, CRUD básico + persistencia.
5. **Match detail**: score steppers + add round + quick rules cards.
6. **PWA shell**: `vite-plugin-pwa` configurado, manifest, iconos, precache de todos los assets.
7. **Update checking**:
   - Script `scripts/build-data-version.mjs` (genera `public/data/data-version.json`).
   - Wiring de `registerSW` con toast de "nueva versión".
   - Hook `useDataVersion` + UI de check manual.
8. **Pulido visual**: paleta exacta, transiciones, "Add to Home Screen" hints en iOS.
9. **Opcional**: import/export JSON, sync con Google Sheet.

### Riesgos / a tener en cuenta
- **iOS Safari & PWA**: sin push, sin background sync. Storage puede ser purgado si no se usa la app por semanas. Para datos críticos (matches del usuario) considerar IndexedDB (vía `idb-keyval`) en lugar de `localStorage`.
- **Sin App Store**: la "instalación" es Add to Home Screen. Para el caso de uso personal está bien.
- **Hosting**: la PWA necesita HTTPS. GitHub Pages / Netlify / Vercel sirven. Definir antes de la fase 6.
