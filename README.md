# Whisper Notes

Whisper Notes is a React application for turning audio recordings into organized,
shareable notes. It includes username-scoped results, audio upload and recording,
WhisperLive transcription, and a common shared-files area.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- Python 3.12 and a local [WhisperLive](https://github.com/collabora/WhisperLive)
  server for real transcription

## Setup

Install the project dependencies:

```bash
npm install
```

Start the frontend and the Whisper Notes persistence backend together:

```bash
npm run dev
```

The command starts:

- React/Vite frontend: `http://localhost:5173`
- Whisper Notes persistence API: `http://127.0.0.1:8787`

If the services need to be run separately:

```bash
npm run server
npm run dev:frontend
```

Restart `npm run dev` after changing `vite.config.js`; an already-running Vite
process does not automatically reload proxy configuration.

## User and Data Flow

This prototype does not implement password authentication. Login requires only a
username. Username comparison ignores capitalization and repeated spaces.

- Results are filtered by the current username.
- Generated results are stored per username in browser `localStorage`.
- Shared Files are common to every username.
- The Share button sends a result to the local persistence API.
- Shared transcript metadata is written to `docs/shared-transcriptions.json`.
- Audio created during the current browser session is copied to
  `docs/audio/shared/` when shared.

For sample data, usernames such as `Erdil Kunt`, `Taylan Deniz Yildirim`, and
`Orhan Sami Bolat` open their corresponding Results entries.

Generated private transcript data remains available for the same username after
logout or browser restart. Its temporary audio blob is available only in the
current single-page application session. Shared entries remain in the repository
files and are available to all users.

## Persistence API

The small Node.js backend in `backend/server.js` lets the browser persist shared
data inside the project:

```text
GET  /api/health
GET  /api/shared-transcriptions
POST /api/shared-transcriptions
GET  /api/shared-audio/:filename
```

During development, Vite proxies `/api` requests to port `8787`. The persistence
API is separate from WhisperLive: it stores application data, while WhisperLive
performs speech-to-text processing.

## WhisperLive Backend

WhisperLive is a separate, free, self-hosted backend. Clone it outside this
frontend repository and follow its installation instructions:

```bash
git clone https://github.com/collabora/WhisperLive.git
cd WhisperLive
bash scripts/setup.sh
python3.12 -m venv whisper_env
source whisper_env/bin/activate
pip install whisper-live fastapi uvicorn python-multipart
```

Start the WebSocket server on port `9090` and its OpenAI-compatible REST API on
port `8000`:

```bash
python3 run_server.py \
  --port 9090 \
  --rest_port 8000 \
  --backend faster_whisper \
  --enable_rest \
  --cors-origins="http://localhost:5173,http://127.0.0.1:5173"
```

The frontend sends the selected or recorded audio asynchronously to:

```text
POST http://localhost:8000/v1/audio/transcriptions
```

The default URL can be changed in `.env.local`:

```bash
VITE_WHISPERLIVE_URL=http://localhost:8000
VITE_APP_API_URL=
```

WhisperLive selects the local inference model on the server. Its REST interface
uses the OpenAI-compatible `whisper-1` model identifier. The first transcription
can take longer while model files are downloaded and loaded.

Keep WhisperLive outside this repository. Do not commit its virtual environment,
downloaded models, or Hugging Face cache. Live WebSocket transcription, database
storage, real authentication, and REST speaker diarization with reference clips
remain future work.

## Docker

Docker Compose can run the complete local stack:

- React production build served by Nginx on `http://localhost:5173`
- Whisper Notes persistence API inside the Compose network
- WhisperLive REST API on `http://localhost:8000`
- WhisperLive WebSocket server on `ws://localhost:9090`

Stop any native `npm run dev` or WhisperLive processes first so ports `5173`,
`8000`, and `9090` are available. Then build and start the stack:

```bash
docker compose up --build -d
```

Check service status and follow WhisperLive logs:

```bash
docker compose ps
docker compose logs -f whisperlive
```

The first WhisperLive start can take longer while the image and model are
downloaded. The model cache is stored in the named
`whisper-notes_whisperlive-models` Docker volume. Shared transcription JSON and
audio files are bind-mounted to the repository `docs/` directory.

Stop the containers without deleting the model cache:

```bash
docker compose down
```

To rebuild only the application containers after frontend or persistence backend
changes:

```bash
docker compose build frontend app-backend
docker compose up -d frontend app-backend
```

The official WhisperLive CPU image currently runs as `linux/amd64`. On an Apple
Silicon Mac, Docker Desktop uses emulation, so transcription is slower than the
native Python setup.

## Build

Create a production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

`npm run preview` serves only the static frontend. Start `npm run server`
separately when testing shared-file persistence outside Vite development mode.

## Project Structure

```text
Dockerfile.frontend              # React build and Nginx image
Dockerfile.backend               # Persistence API image
compose.yaml                     # Full local Docker stack
docker/
└── nginx.conf                   # SPA routing and /api reverse proxy
backend/
└── server.js                    # Shared-file persistence API
docs/
├── audio/                       # Sample and shared audio files
├── shared-transcriptions.json  # Common shared transcription data
└── transcript1.json            # Sample transcription
scripts/
└── dev.mjs                     # Starts backend and Vite together
src/
├── assets/                      # Images, icons, and static assets
├── components/                  # Reusable interface components
├── pages/                       # Application page components
├── services/                    # API and browser-storage integrations
├── styles/                      # Global and shared styles
├── App.jsx                      # Root application component
└── main.jsx                     # React entry point
```

The connected views are Login, Home, Transcribe, Results, and Shared Files.
