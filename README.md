# Gather — Even8 Event Lead Manager

A small event lead manager built for the Even8 AI Native Full Stack Intern assignment. It keeps event contacts in one place and summarizes conversation notes with Gemini.

## Features

- Add, edit, delete, search, and filter event leads.
- Store a lead's name, company, email, event, notes, and follow-up status in Supabase Postgres.
- Generate a concise AI summary of a lead's event notes with the Gemini API.
- Responsive React interface for desktop and mobile.
- Show a simple demo sign-in screen before opening the dashboard.
- Keep database and AI credentials in server-side environment variables.

## Stack

- React 19 and Vite for the frontend.
- Small JavaScript API routes in `api/`, served locally with the bundled Node/Vite development runner and deployed as Vercel Functions.
- Supabase Postgres for persistent lead storage.
- Gemini `generateContent` API for note summaries.

The frontend only calls this app's `/api` routes. The Supabase secret key and Gemini API key are read by the server functions and must never be prefixed with `VITE_` or committed to GitHub.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Create a Supabase project and run [`db/schema.sql`](db/schema.sql) in the Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and fill in the values from your Supabase project and Google AI Studio.
5. Run `npm run dev` and open `http://localhost:3000`.

The local runner serves the Vite app and forwards `/api` requests to the same JavaScript handlers used by Vercel. It reads `.env.local` and does not create, link, or deploy a Vercel project. The demo sign-in uses `jayesh@gmail.com` / `jayesh` in the browser and is not real security. The Gemini key is only needed for AI note summaries; the lead database works without it.

## Environment variables

| Variable | Where to find it | Used for |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase project settings | Server-side database REST requests |
| `SUPABASE_SECRET_KEY` | Supabase project API keys | Server-side database access; never expose in the browser |
| `GEMINI_API_KEY` | Google AI Studio | Server-side AI note summarization |
| `GEMINI_MODEL` | Optional; defaults to `gemini-3.5-flash-lite` | Select the Gemini model |

Add the same variables to the Vercel project's environment settings before deployment. Do not share keys in chat, commit them, or include them in screenshots.

## Deploy

1. Import this GitHub repository into Vercel.
2. Add the environment variables above in the Vercel project settings.
3. Deploy. Vercel builds the Vite app and serves the files in `api/` as server functions.
4. Add the live URL to this README after deployment.

## Database

The schema is in `db/schema.sql`. It creates one `leads` table with a UUID primary key, required contact name and email, optional company/event/notes, a constrained follow-up status, and timestamps. The server accesses the table with Supabase's server-side secret key. Row Level Security is enabled, with no public anonymous table policies. The API routes are accessible without the demo login, so do not use this setup to protect private data.

## AI behavior

`POST /api/ai-summary` sends only the lead's notes to Gemini and returns a concise plain-text summary. The API handler reads `GEMINI_API_KEY` on the server; the browser never receives the key. Empty notes are handled in the UI without calling Gemini, and the API validates notes independently. Summaries are shown in the interface and are not saved to the database.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/leads` | List leads, newest first |
| `POST` | `/api/leads` | Validate and create a lead |
| `PATCH` | `/api/leads/:id` | Validate and update a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/ai-summary` | Summarize a lead's notes with Gemini |

## Notes for the assignment demo

Use fictional lead data in the public demo. The demo login is a visual gate only: its credentials are included in browser code, and the lead and AI APIs do not require sign-in. Do not use real or private lead data.

## Requirement checklist

- [x] Add, edit, delete, search, and filter leads
- [x] Lead fields: name, company, email, event, notes, follow-up status
- [x] Persistent database schema and API routes
- [x] AI-generated note summary
- [x] Responsive UI
- [x] Setup and deployment documentation
- [ ] Add the deployed URL after publishing

