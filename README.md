# Gather — Even8 Event Lead Manager

A small AI-assisted event lead manager built for the Even8 AI Native Full Stack Intern assignment. Visitors can explore an interactive public demo, while the owner can sign in to manage private Supabase leads and generate Gemini summaries.

## Features

- Add, edit, delete, search, and filter leads.
- Track name, company, email, event, notes, and follow-up status.
- Public demo edits stay in that visitor's browser and use fictional sample data.
- Owner sign-in unlocks persistent Supabase CRUD and AI note summaries.
- Gemini creates concise summaries from saved lead notes.
- Responsive React interface for desktop and mobile.

## Stack

- React 19 and Vite for the frontend.
- JavaScript API routes in `api/`, served locally by the Node/Vite runner and deployed as Vercel Functions.
- Supabase Postgres for the owner's persistent lead data.
- Gemini `generateContent` API for owner-only note summaries.

The browser calls this app's `/api` routes. Supabase secret and Gemini API keys, owner credentials, and the session signing secret are server-side environment variables and must never use a `VITE_` prefix or be committed.

## Run locally

1. Install Node.js 20 or newer and run `npm install`.
2. Create a Supabase project and run [`db/schema.sql`](db/schema.sql) in its SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in all server environment variables.
4. Use a long, unique owner password and generate a random session signing secret of at least 32 characters.
5. Run `npm run dev` and open `http://localhost:3000`.

The public preview works with fictional sample data without environment variables. Visitor edits remain in that browser. To test private Supabase CRUD and Gemini summaries locally, configure the owner and service environment variables first. `.env.local` is ignored by Git.

## Environment variables

| Variable | Used for |
| --- | --- |
| `SUPABASE_URL` | Server-side database requests |
| `SUPABASE_SECRET_KEY` | Private Supabase access from API routes only |
| `GEMINI_API_KEY` | Owner-only server-side AI note summaries |
| `GEMINI_MODEL` | Optional model selector; defaults to `gemini-3.5-flash-lite` |
| `APP_LOGIN_EMAIL` | Single owner login email |
| `APP_LOGIN_PASSWORD` | Single owner login password; use a long random value |
| `AUTH_SESSION_SECRET` | Random secret used to sign HttpOnly owner sessions |

Set these in Vercel Project Settings → Environment Variables for Production, Preview, and Development. Mark secret values sensitive/encrypted. The browser never receives them.

## Deployment

The project is linked to the public GitHub repository [`ohyeskk/even8-ai-event-lead-manager`](https://github.com/ohyeskk/even8-ai-event-lead-manager). Add the environment variables in Vercel before deploying. The `api/` handlers run as Vercel Functions; the owner session cookie is HttpOnly, SameSite, and Secure in production.

## Database and access

The schema in `db/schema.sql` creates one `leads` table with UUID IDs, required contact name and email, optional company/event/notes, a constrained follow-up status, timestamps, and row-level security. Anonymous visitors only receive fictional sample rows from the server and can change them in their own browser. Only the authenticated owner session can call lead mutations, read Supabase data, or generate summaries. The service key stays on the server.

## AI behavior

`POST /api/ai-summary` accepts notes only for an authenticated owner, sends them to Gemini, and returns concise plain text. Empty and incomplete responses are rejected, and temporary model unavailability is reported clearly. Summaries are not saved to the database.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth` | Check owner session state |
| `POST` | `/api/auth` | Sign in the owner |
| `DELETE` | `/api/auth` | Sign out the owner |
| `GET` | `/api/leads` | Return owner data or fictional public demo leads |
| `POST` | `/api/leads` | Create an owner lead |
| `PATCH` | `/api/leads/:id` | Update an owner lead |
| `DELETE` | `/api/leads/:id` | Delete an owner lead |
| `POST` | `/api/ai-summary` | Summarize owner lead notes |

## Assignment checklist

- [x] Add, edit, delete, search, and filter leads
- [x] Lead fields: name, company, email, event, notes, follow-up status
- [x] Supabase persistence for the owner
- [x] Gemini note summarization
- [x] Responsive UI
- [x] Public interactive demo
- [x] Setup and deployment documentation

