# Snip — URL Shortener

> A production-ready full-stack URL shortener built with **Node.js**, **Express**, **MongoDB**, **Redis**, and **React**.

![Stack](https://img.shields.io/badge/Node.js-20-green) ![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/MongoDB-7-darkgreen) ![Stack](https://img.shields.io/badge/Redis-7-red)

---

## Features

- **Shorten any URL** — generates a unique 6-character code via `nanoid`
- **Custom short codes** — choose your own alias (e.g. `/my-link`)
- **Click tracking** — counts every redirect, stores referrer and user-agent
- **Analytics** — per-link stats with daily click history bar chart
- **Expiration dates** — links auto-deactivate after N days
- **Redis caching** — fast redirects without hitting MongoDB every time
- **Rate limiting** — protects the API from abuse
- **Duplicate detection** — returns existing short URL for the same long URL
- **MVC architecture** — clean, modular backend
- **Docker support** — one command to run everything

---

## Project Structure

```
url-shortener/
├── server/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── redis.js           # Redis connection (optional)
│   ├── controllers/
│   │   └── urlController.js   # Business logic
│   ├── middleware/
│   │   ├── rateLimiter.js     # express-rate-limit setup
│   │   └── errorHandler.js    # Global error + 404 handlers
│   ├── models/
│   │   └── Url.js             # Mongoose schema
│   ├── routes/
│   │   └── urlRoutes.js       # Express router
│   ├── tests/
│   │   └── urlRoutes.test.js  # Jest + Supertest unit tests
│   ├── server.js              # App entry point
│   ├── jest.config.json
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ShortenForm.jsx  # URL input + advanced options
│   │   │   ├── UrlCard.jsx      # Individual link card + stats drawer
│   │   │   └── UrlList.jsx      # Paginated link list
│   │   ├── hooks/
│   │   │   ├── useClipboard.js  # Copy-to-clipboard hook
│   │   │   └── useUrls.js       # URL CRUD state hook
│   │   ├── utils/
│   │   │   └── api.js           # Axios API wrapper
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile.server
├── Dockerfile.client
├── docker-compose.yml
├── nginx.conf
├── .gitignore
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Redis (optional — app works without it)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener

# Install all dependencies
npm run install:all
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/urlshortener
REDIS_URL=redis://localhost:6379   # remove this line if you don't have Redis
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

### 3. Start the development servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
npm run dev:server
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:client
# App running on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Docker (Recommended for Production)

Run everything with one command:

```bash
docker compose up --build
```

This starts:
- **MongoDB** on port 27017
- **Redis** on port 6379
- **Express API** on port 5000
- **React (nginx)** on port 80

Visit http://localhost

To stop:
```bash
docker compose down
```

To stop and delete all data:
```bash
docker compose down -v
```

---

## API Reference

Base URL: `http://localhost:5000`

### Create short URL

```http
POST /api/urls
Content-Type: application/json

{
  "originalUrl": "https://www.example.com/very/long/path",
  "customCode": "my-link",   // optional
  "expiresIn": 7             // optional, days (1-365)
}
```

**Response 201:**
```json
{
  "id": "...",
  "originalUrl": "https://www.example.com/very/long/path",
  "shortCode": "abc123",
  "shortUrl": "http://localhost:5000/abc123",
  "clicks": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "expiresAt": null
}
```

### List all URLs

```http
GET /api/urls?page=1&limit=10
```

### Get URL stats

```http
GET /api/urls/:shortCode
```

### Delete URL

```http
DELETE /api/urls/:shortCode
```

### Redirect

```http
GET /:shortCode
→ 301 redirect to originalUrl
```

### Health check

```http
GET /health
→ { "status": "ok", "timestamp": "..." }
```

---

## Running Tests

```bash
cd server
npm test
```

Tests cover:
- POST /api/urls — create, duplicate detection, validation, custom codes
- GET /api/urls — pagination
- GET /api/urls/:shortCode — stats, 404
- DELETE /api/urls/:shortCode — deactivation, 404

---

## Deployment Guide

### Render (Free Tier)

**Backend:**
1. Create a new **Web Service** on [render.com](https://render.com)
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env.example`
6. Set `BASE_URL` to your Render URL (e.g. `https://snip-api.onrender.com`)

**Frontend:**
1. Create a new **Static Site** on Render
2. Root directory: `client`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add env variable: `VITE_API_URL=https://snip-api.onrender.com`

**MongoDB:** Use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier. Copy the connection string into `MONGO_URI`.

**Redis:** Use [Upstash](https://upstash.com) free tier. Copy the connection string into `REDIS_URL`.

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

Set environment variables in the Railway dashboard.

---

## System Design

```
Client (React)
     │
     │ HTTP/REST
     ▼
Express API (Node.js)
     │                ┌─────────────┐
     ├── GET /:code ──► Redis Cache  │ (cache hit: ~1ms)
     │                └──────┬──────┘
     │                       │ cache miss
     │                ┌──────▼──────┐
     └── all routes ──► MongoDB      │ (indexed shortCode lookup)
                       └─────────────┘
```

**Why Redis?**
Redirects are the hot path — every click hits `GET /:shortCode`. Redis caches the `originalUrl` so MongoDB is only queried on cache miss. The click counter is updated asynchronously (fire-and-forget) to keep redirects fast.

**Idempotency:**
Submitting the same long URL twice returns the existing short URL (HTTP 200) rather than creating a duplicate. Enforced at the DB level with a unique index on `shortCode`.

**Rate limiting:**
- General API: 100 requests per 15 minutes (GET exempt)
- URL creation: 10 per minute per IP

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | MongoDB 7 + Mongoose |
| Cache | Redis 7 + ioredis |
| Short codes | nanoid |
| Frontend | React 18 + Vite |
| HTTP client | Axios |
| Rate limiting | express-rate-limit |
| Tests | Jest + Supertest |
| Containerisation | Docker + Docker Compose |
| Reverse proxy | nginx |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `MONGO_URI` | — | MongoDB connection string |
| `REDIS_URL` | — | Redis URL (optional) |
| `BASE_URL` | `http://localhost:5000` | Used in short URL responses |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

---

## License

MIT
