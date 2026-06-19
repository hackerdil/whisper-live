# Whisper Notes

Whisper Notes is a React frontend for turning audio recordings into organized,
shareable notes. The project is initialized with Vite and includes placeholder
screens for the core application flow.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Setup

Install the project dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Vite will print the local URL in the terminal, typically
`http://localhost:5173`.

## Build

Create a production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
├── assets/       # Images, icons, and other static assets
├── components/   # Reusable interface components
├── pages/        # Application page components
├── services/     # API clients and external service integrations
├── styles/       # Global and shared styles
├── App.jsx       # Root application component
└── main.jsx      # React entry point
```

The current placeholder pages are Login, Transcribe, Results, and Shared Files.
