# Learn DL

This project now includes a small Express backend for local auth testing alongside the Vite frontend.

## Backend API

Start the API server:

```bash
npm run server:dev
```

The server runs on `http://localhost:3000` and exposes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/protected/ping`
- `GET /api/health`

On first start, the backend creates `server/data/users.json` and seeds a demo user:

- email: `demo@example.com`
- password: `password123`

Optional environment variables:

- `PORT` defaults to `3000`
- `FRONTEND_ORIGIN` defaults to `http://localhost:5173,http://127.0.0.1:5173`
- `JWT_SECRET` defaults to a local development secret
- `TOKEN_TTL` defaults to `1h`

## Frontend

Start the Vite app in a second terminal:

```bash
npm run dev
```

The frontend API base URL defaults to `http://localhost:3000/api`. Override it with `VITE_API_URL` if needed.
