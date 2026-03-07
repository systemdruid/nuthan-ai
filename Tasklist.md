# Manual Setup Tasklist

## Prerequisites

- [ ] Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [ ] Verify Docker is running: `docker --version` and `docker compose version`
- [ ] Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

---

## One-Time Setup

- [ ] Open `.env` in the project root and replace `your_key_here` with your actual Anthropic API key:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
  > The Postgres credentials in `.env` can stay as-is for local development.

---

## Running the App

- [ ] From the project root (`test-ai/`), build and start all services:
  ```bash
  docker compose up --build
  ```
  Wait for all three services to be ready:
  - `db` — PostgreSQL (health check passes)
  - `backend` — Django runs migrations then starts on port 8000
  - `frontend` — React dev server starts on port 3000

- [ ] Open the app in your browser: **http://localhost:3000**

---

## Smoke Tests (optional but recommended)

- [ ] Create a note via the API:
  ```bash
  curl -X POST http://localhost:8000/api/notes/ \
    -H "Content-Type: application/json" \
    -d '{"title":"ML Notes","content":"Transformers use attention mechanism"}'
  ```
  Expected: `201 Created` with the note JSON.

- [ ] Query notes with AI:
  ```bash
  curl -X POST http://localhost:8000/api/notes/query/ \
    -H "Content-Type: application/json" \
    -d '{"query":"What did I write about machine learning?"}'
  ```
  Expected: JSON with `relevant_notes` array and `explanation` string.

- [ ] Open **http://localhost:3000**, add a note through the UI, and use the "Ask AI" search bar to find it.

---

## Stopping the App

- [ ] Stop all containers:
  ```bash
  docker compose down
  ```
  > Add `-v` to also delete the Postgres volume (wipes all saved notes): `docker compose down -v`

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Backend crashes immediately | Check `.env` has a valid `ANTHROPIC_API_KEY` |
| `db` never becomes healthy | Port 5432 may be in use by a local Postgres — stop it first |
| Frontend shows API errors | Ensure backend is on port 8000 and CORS is not blocked |
| AI query returns empty results | Confirm your API key has credits and the model `claude-sonnet-4-6` is accessible |
| Changes to `src/` not reflected | The `src/` folder is volume-mounted; save the file and the browser should hot-reload |
