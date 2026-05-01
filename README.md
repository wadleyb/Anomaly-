# ANOMALY

A minimalist mobile puzzle game built with Expo / React Native, featuring a custom soundtrack of 30+ ambient tracks.

## Project structure

```
.
├── mobile/         # Expo / React Native app (iOS + Android + web)
├── web/            # Companion web app (Vite + React Router)
├── Assets/music/   # Source MP3 soundtrack
└── *.mp3           # Additional soundtrack masters
```

## Mobile app (Expo)

```bash
cd mobile
npm install
npx expo start
```

- `src/screens/` — HomeScreen, ModeSelectScreen, GameScreen, SettingsScreen
- `src/utils/audio/musicManager.js` — global audio player (singleton, background-safe)
- `src/utils/audio/musicLibrary.js` — playlist of hosted MP3 URIs
- Music streams from Uploadcare CDN; original masters live in `Assets/music/` and the repo root.

Copy `mobile/.env.example` to `mobile/.env` and fill in your keys before running.

## Web app

```bash
cd web
bun install   # or: npm install
bun run dev
```

## Soundtrack

All `Anomaly *.mp3` files in this repo are the original masters used by the in-game music manager. UI sound effects:

- `Minimalistic_UI_succ_#1-...mp3`
- `ery_soft,_minimal_er_#1-...mp3`
