# Folio

Folio is a lending library. Readers browse the catalog and request loans, authors file manuscripts, and admins publish books, manage members, and run the loan desk.

**Live app:** [https://foliolibrary.vercel.app](https://foliolibrary.vercel.app)

**API:** [https://book-management-app-2at7.onrender.com](https://book-management-app-2at7.onrender.com)

**API docs:** [https://book-management-app-2at7.onrender.com/docs](https://book-management-app-2at7.onrender.com/docs)

The free Render instance sleeps when it is idle. The first request after a pause can take a minute.

## Demo accounts

These accounts are for trying the live app. The password for each is `Ramjan123`.

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Admin | Main Admin | `admin@test.com` | `Ramjan123` |
| Author | George Author | `author@test.com` | `Ramjan123` |
| Reader | Regular Reader | `user@test.com` | `Ramjan123` |

## Repository

| Folder | What it is |
| --- | --- |
| `frontend` | React app. See [frontend/README.md](frontend/README.md). |
| `backned` | NestJS API. See [backned/README.md](backned/README.md). |
| `assets/images` | Project images used on the catalog, loan, author, and admin views. |

## Stack

- **Web:** React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit
- **API:** NestJS 11, Prisma, PostgreSQL, JWT

## Run it locally

Start the API, then the web app.

```bash
cd backned
npm install
npx prisma migrate deploy
npm run start:dev
```

```bash
cd frontend
npm install
npm start
```

The API listens on [http://localhost:5000](http://localhost:5000). The app opens at [http://localhost:3000](http://localhost:3000).

Copy `backned/.env.example` to `backned/.env` before the first API start. Setup details, scripts, and deployment notes are in the frontend and backend READMEs.
