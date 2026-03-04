# 🔗 Snipify — URL Shortener

A full-stack URL shortener built with **Node.js**, **Express**, **MongoDB**, and **React**. Deployed and live in production.

> 🌐 **Live Demo:** https://snipify-client.onrender.com
> 🔌 **API:** https://snipify-server.onrender.com

---

## 📊 Performance Stats

Tested with [Pingdom Tools](https://tools.pingdom.com) on the live production deployment:

| Metric | Result |
|---|---|
| ⚡ Performance Grade | **A (94 / 100)** |
| 🕐 Load Time | **237 ms** |
| 📦 Page Size | **72.0 KB** |
| 🔁 HTTP Requests | **5** |

---

## ✨ Features

- Shorten any valid http/https URL
- Auto-deduplication — same URL always returns the same short code
- Custom aliases (`snip.ly/my-link`)
- Expiration dates for links
- Click tracking with per-click history
- Analytics dashboard with pagination
- Rate limiting (global + per-endpoint)
- Full error handling and input validation
- Docker support — one command to run everything locally

---

## 🗂 Project Structure

```
url-shortener/
├── server/
│   ├── controllers/
│   │   └── urlController.js         # CRUD + redirect logic
│   ├── models/
│   │   └── Url.js                   # Mongoose schema
│   ├── routes/
│   │   └── urlRoutes.js             # API routes
│   ├── middleware/
│   │   ├── errorHandler.js          # Global error handler
│   │   └── rateLimiter.js           # Rate limiting
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── redis.js                 # Redis config (disabled)
│   ├── server.js                    # Entry point
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── utils/
│   │   │   └── api.js               # Axios API wrapper
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local with Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Run everything with one command
```bash
git clone https://github.com/spoja-10/url-shortener.git
cd url-shortener
docker compose up --build
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| Express API | http://localhost:5000 |
| MongoDB | localhost:27017 |

---

## 💻 Local Development (without Docker)

### Backend
```bash
cd server
cp .env.example .env    # fill in your MONGO_URI
npm install
npm run dev             # starts on http://localhost:5000
```

### Frontend
```bash
cd client
npm install
npm run dev             # starts on http://localhost:5173
```

---

## 🔌 API Reference

### `POST /api/urls` — Create short URL

**Body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/path",
  "customCode": "my-link",
  "expiresIn": 7
}
```

**Response `201`:**
```json
{
  "id": "...",
  "originalUrl": "https://www.example.com/very/long/path",
  "shortCode": "mFIYnT",
  "shortUrl": "https://snipify-server.onrender.com/mFIYnT",
  "clicks": 0,
  "createdAt": "2026-03-04T00:00:00.000Z",
  "expiresAt": null
}
```

### `GET /api/urls` — List all URLs
```
GET /api/urls?page=1&limit=10
```

### `GET /api/urls/:shortCode` — Get stats
```
GET /api/urls/mFIYnT
```

### `DELETE /api/urls/:shortCode` — Delete
```
DELETE /api/urls/mFIYnT
```

### `GET /:shortCode` — Redirect
```
GET /mFIYnT  →  301 redirect to original URL
```

---

## ☁️ Deployment

Deployed on **Render** free tier with **MongoDB Atlas** (free M0 cluster).

| Service | Platform | URL |
|---|---|---|
| React Frontend | Render Static Site | https://snipify-client.onrender.com |
| Express API | Render Web Service | https://snipify-server.onrender.com |
| MongoDB | MongoDB Atlas M0 | cloud.mongodb.com |

### Deploy your own
1. Fork this repo
2. Create a [MongoDB Atlas](https://mongodb.com/atlas) free cluster
3. Create a [Render](https://render.com) account
4. Deploy `server/` as a Web Service with these env vars:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGO_URI` | your Atlas connection string |
| `BASE_URL` | your Render server URL |
| `CLIENT_URL` | your Render client URL |

5. Deploy `client/` as a Static Site with:

| Key | Value |
|---|---|
| `VITE_API_URL` | your Render server URL |

---

## 🏗 System Design

```
User → React (Vite, 72KB bundle)
         │
         ▼ HTTPS /api/*
      Express API (Node.js)
         │
         ▼
      MongoDB Atlas
      (persistent storage)
```

**Redirect flow:**
1. `GET /:shortCode` hits Express
2. MongoDB lookup by shortCode (indexed)
3. Click recorded asynchronously
4. 301 redirect sent to client

**Rate limiting:**
- Global: 100 req / 15 min per IP
- URL creation: 20 req / 15 min per IP

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Axios |
| Backend | Node.js, Express 4, nanoid |
| Database | MongoDB 7, Mongoose |
| Security | Helmet, CORS, express-rate-limit |
| DevOps | Docker, Docker Compose, Render, GitHub |

---

## 📈 CV Summary

> *Full-stack URL shortener achieving a **94/100 Pingdom performance score** with a **237ms load time** and **72KB page size**. Built with React, Node.js, Express, and MongoDB Atlas. Features click analytics, custom aliases, rate limiting, and Docker containerisation. Deployed to production on Render with a live public URL.*