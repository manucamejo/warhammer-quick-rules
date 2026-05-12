# Warhammer Quick Rules

App iOS en `SwiftUI` para explorar ejércitos de Warhammer Age of Sigmar desde el spreadsheet público:

`https://docs.google.com/spreadsheets/d/12yiSFPhptA95R7Gihxq3g5HMJvjdwm9AsSHO2RxXKBo/edit?gid=0#gid=0`

## Qué hace hoy

- Lista los ejércitos disponibles.
- Permite buscar por facción, spearhead y texto relacionado.
- Muestra detalle con imagen pública del ejército, reglas, alianza, puntos y estado.
- Conserva la referencia de `Quick Rules` para dejar lista una segunda iteración.

## Limitación actual de datos

La columna `Quick Rules` del spreadsheet público está publicada como `file chip`. Google expone el nombre del archivo, pero no una URL pública directa de la imagen en el HTML accesible sin autenticación. Por eso esta versión:

- usa la imagen pública del ejército que sí expone la hoja;
- muestra el nombre del archivo de `Quick Rules` como referencia en el detalle.

## Requisitos

- macOS con Xcode 26 o más reciente.
- iOS Simulator o un iPhone físico.
- Conexión a internet al abrir la app, porque los datos se descargan desde Google Sheets.

## Clonar o bajar el repo

Si lo subís a GitHub:

```bash
git clone <TU_URL_DEL_REPO>
cd warhammer
```

Si ya lo bajaste como zip:

```bash
cd warhammer
```

## Abrir el proyecto

Opción 1, desde Finder o Xcode:

- Abrí `WarhammerQuickRules.xcodeproj`

Opción 2, desde terminal:

```bash
open WarhammerQuickRules.xcodeproj
```

## Build desde Xcode

1. Elegí el target `WarhammerQuickRules`.
2. Elegí un destino:
   `iPhone 16`, `iPhone 16 Pro`, o cualquier simulador disponible.
3. Ejecutá:
   `Product > Build`
4. Para correr:
   `Product > Run`

Atajo:

- `Cmd + B` para build
- `Cmd + R` para correr

## Build desde terminal

Listar simuladores disponibles:

```bash
xcrun simctl list devices
```

Build para simulador:

```bash
xcodebuild \
  -project WarhammerQuickRules.xcodeproj \
  -scheme WarhammerQuickRules \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build
```

Si no tenés `iPhone 16`, cambiá el nombre por cualquiera de `xcrun simctl list devices`.

## Correr en simulador

1. Abrí el simulador desde Xcode o con:

```bash
open -a Simulator
```

2. Corré la app desde Xcode con `Cmd + R`.

Opcionalmente podés bootear un simulador específico:

```bash
xcrun simctl boot "iPhone 16"
open -a Simulator
```

## Instalar y correr en un iPhone físico

1. Conectá el iPhone por cable o Wi‑Fi.
2. Abrí `WarhammerQuickRules.xcodeproj`.
3. En Xcode, elegí tu iPhone como destino.
4. En `Signing & Capabilities`, seleccioná tu `Team`.
5. Si hace falta, cambiá el `Bundle Identifier`.
6. Presioná `Cmd + R`.
7. En el iPhone, aceptá al desarrollador si iOS lo pide.

## Estructura

- `WarhammerQuickRules.xcodeproj`: proyecto Xcode.
- `WarhammerQuickRules/ArmyRepository.swift`: descarga y parseo del spreadsheet público.
- `WarhammerQuickRules/ArmyListViewModel.swift`: estado y búsqueda.
- `WarhammerQuickRules/ArmyListView.swift`: listado y detalle SwiftUI.
- `WarhammerQuickRules/Army.swift`: modelo de dominio.

## Próxima iteración sugerida

- Armar una partida `1vs1`.
- Persistir selección local.
- Resolver imágenes reales de `Quick Rules` si aparece una fuente pública con URL directa.
