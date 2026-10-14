# AcuPoints Local

Local acupoint reference with Russian translation support.

## Project Structure

```
acupoints-local/
├── server.js                  # Main Express server (file-based)
├── public/                    # Static files
│   ├── index.html             # Main page
│   ├── app.js                 # Frontend logic
│   ├── styles.css             # Stylesheet
│   └── images/
│       └── acupoints/         # Acupoint images (173 .jpg files)
├── content/
│   └── acupoints/             # Individual acupoint docs (173 .md files)
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose orchestration
├── Makefile                   # Development shortcuts (run `make help`)
├── nginx/
│   └── nginx.conf             # Nginx reverse proxy config
└── .env                       # Environment variables
```

## Quick Start

### Prerequisites
- Docker Engine with the Compose V2 plugin (`docker compose`)
- Node.js 18+ (optional, for local development)

### Using Docker (Recommended)

```bash
# Build and start all services
cd acupoints-local
docker compose up -d

# Access the application
# Frontend: http://localhost
# API: http://localhost/api
```

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Make Shortcuts

A `Makefile` wraps the common tasks. Run `make help` for the full list.

```bash
make help      # list every target (default goal)
make install   # npm ci (falls back to npm install)
make dev       # server with nodemon
make start     # server in the foreground

make up        # build and start the Docker stack
make down      # stop the stack (volumes are kept)
make restart   # restart the stack
make build     # rebuild the Docker images
make logs      # follow container logs
make ps        # status of every service
make shell     # shell inside the app container

make health    # GET /health (exits non-zero if the API is down)
make verify    # check the content for untranslated placeholders
make clean     # stop the stack and remove node_modules
```

Override `COMPOSE`, `NPM`, `PORT` or `HEALTH_URL` in the environment if
your setup differs, e.g. `make up COMPOSE="docker compose -f prod.yml"`.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api | API overview |
| GET /api/acupoints | List all acupoints |
| GET /api/acupoints/:id | Get single acupoint |
| GET /api/acupoints/search/:term | Search acupoints |
| GET /api/categories | List all categories |
| GET /api/languages | Available languages |
| GET /images/* | Static images |

## Features

- **Static Content**: All data stored as Markdown files
- **Node.js Server**: Express.js API backend
- **Multi-language**: English and Russian support
- **Docker**: Complete containerized deployment
- **Nginx**: Reverse proxy with static file serving

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Content Format

Each acupoint is a Markdown file in `content/acupoints/` with YAML frontmatter:

```markdown
---
id: bl1
name: "BL 1 Acupuncture Point"
name_ru: "BL 1 (Цзинмин)"
location: "On the face, in the depression superior to the inner canthus."
location_ru: "На лице, в углублении выше внутреннего угла глаза."
meridian: "Bladder Meridian"
category: ""
image: "bl1.jpg"
tags: [bladder-meridian]
---

## Description          # English
## Location             # English
## Indications          # English
## Benefits             # Russian
## Classification       # Russian
```

The server parses `content/acupoints/*.md` at startup and keys entries by the
frontmatter `id`. Fields `name_ru`, `location_ru` and the `body` are indexed by
the search endpoint (`server.js:115`).
