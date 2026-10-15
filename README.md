# Food Store — Fresh Market

A small full-stack food store starter with:
- React + Vite frontend
- Express REST API
- PostgreSQL database
- JWT authentication (register/login)
- Sample food catalog
- Cream-and-green Fresh Market design

## Requirements
- Node.js 20+ (18+ may work)
- PostgreSQL 14+

## 1. Configure PostgreSQL

Create a database:

```sql
CREATE DATABASE food_store;
```

Then run the schema and sample data:

```bash
psql -d food_store -f database/schema.sql
psql -d food_store -f database/seed.sql
```

If your PostgreSQL setup requires a username/password, use those values in `backend/.env`.

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Edit `.env` and set `DATABASE_URL` and a long random `JWT_SECRET`.

Example:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/food_store
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

The API runs at `http://localhost:4000`.

## 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Demo flow
1. Select **Create account** and register with your name, email, and password.
2. You will be signed in and taken to the food catalog.
3. Log out to return to the login page.
4. Sign in with the account you created.

The catalog reads from PostgreSQL. Sample products are in `database/seed.sql`.

## API endpoints
- `GET /api/health`
- `GET /api/products`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT required)
- `GET /api/auth/forgot-password`
- `GET /api/auth/reset-password`
- `GET /api/auth/recover-account-email`
- `GET /api/auth/recovery-email/request` (JWT required)
- `GET /api/auth/recovery-email/verify` 
- `GET /api/auth/change-password` (JWT required)

## Security notes
- Passwords are hashed with bcrypt.
- The API validates registration inputs and signs JWTs.
- The frontend stores the JWT in `localStorage` for this starter. For a production application, consider secure, HttpOnly cookies, CSRF protections where applicable, rate limiting, email verification, password reset, HTTPS, and a managed secrets strategy.
- Never commit `.env` files or production secrets.
- Do not trust frontend validation alone; the API validates input independently.

## Useful commands
Backend:
- `npm run dev` — start with nodemon
- `npm start` — production-style start

Frontend:
- `npm run dev` — development server
- `npm run build` — production build
