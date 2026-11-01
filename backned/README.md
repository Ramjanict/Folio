# Folio API

REST API for Folio. It serves the public catalog, author submissions, admin publishing, member accounts, and the loan desk.

**Live API:** [https://book-management-app-2at7.onrender.com](https://book-management-app-2at7.onrender.com)

**API docs:** [https://book-management-app-2at7.onrender.com/docs](https://book-management-app-2at7.onrender.com/docs)

**Live app:** [https://foliolibrary.vercel.app](https://foliolibrary.vercel.app)

**Repository:** [https://github.com/Ramjanict/Folio](https://github.com/Ramjanict/Folio)

The free Render instance sleeps when it is idle. The first request after a pause can take a minute.

## Demo accounts

These accounts exist in the shared database. The password for each is `Ramjan123`.

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Admin | Main Admin | `admin@test.com` | `Ramjan123` |
| Author | George Author | `author@test.com` | `Ramjan123` |
| Reader | Regular Reader | `user@test.com` | `Ramjan123` |

Sign in with `POST /auth/login`:

```json
{
  "email": "admin@test.com",
  "password": "Ramjan123"
}
```

## Stack

- NestJS 11 and TypeScript
- Prisma and PostgreSQL
- JWT access and refresh tokens
- Swagger at `/docs`

## Roles

| Role | Access |
| --- | --- |
| Reader | Catalog, saved books, and loan requests |
| Author | Manuscript studio. Drafts stay private until they are submitted |
| Admin | Publish books, manage categories and people, and advance loans |

Stock changes only when a copy is marked borrowed or returned. Approving a request does not change stock.

## Run it locally

```bash
cd backned
npm install
```

Copy `.env.example` to `.env` and set a Postgres connection string plus two JWT secrets:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_ACCESS_SECRET="replace-with-a-long-random-string"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-string"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
```

Apply migrations, then start the API:

```bash
npx prisma migrate deploy
npm run start:dev
```

The API listens on [http://localhost:5000](http://localhost:5000). Swagger is at [http://localhost:5000/docs](http://localhost:5000/docs).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start the API with watch mode |
| `npm run build` | Compile to `dist` |
| `npm run start:prod` | Run the compiled API |
| `npm run prisma:migrate` | Apply Prisma migrations |
| `npm run seed` | Seed demo users |
| `npm test` | Run unit tests |

## Deploy

The production service is a Render web service with root directory `backned`.

Build command:

```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start command:

```bash
npm run start:prod
```

Do not set `PORT` on Render. The platform provides it. Use the direct Postgres host for `DATABASE_URL`, with `sslmode=require`.
