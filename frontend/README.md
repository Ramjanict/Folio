# Folio

Folio is the web app for a lending library. Readers browse the catalog and request loans, authors file manuscripts, and admins publish books, manage members, and run the loan desk.

**Live app:** [https://foliolibrary.vercel.app](https://foliolibrary.vercel.app)

**API:** [https://book-management-app-2at7.onrender.com](https://book-management-app-2at7.onrender.com)

**Repository:** [https://github.com/Ramjanict/Folio](https://github.com/Ramjanict/Folio)

## Demo accounts

These accounts are for testing the live app and a local API pointed at the same database. The password for each is `Ramjan123`.

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Admin | Main Admin | `admin@test.com` | `Ramjan123` |
| Author | George Author | `author@test.com` | `Ramjan123` |
| Reader | Regular Reader | `user@test.com` | `Ramjan123` |

## What you can do

- Search the catalog, browse category stacks, and filter by price.
- Save books and request a loan when a copy is in stock.
- Draft a manuscript in the author studio and submit it for review.
- Publish books, manage people and categories, and advance loans from the admin desk.

## Stack

- React 18 and TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit and RTK Query
- React Router

## Run it locally

The API should already be running on port `5000`.

```bash
cd frontend
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

Create `frontend/.env.development` if it is not already there:

```bash
VITE_API_URL=http://localhost:5000
```

To talk to the deployed API instead:

```bash
VITE_API_URL=https://book-management-app-2at7.onrender.com
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Vite dev server on port 3000 |
| `npm run build` | Typecheck and build the production app |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Typecheck the project |
