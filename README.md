# NEXTREE SCOT Portal

Production-ready SCOT (Sales Coordinator Order Tracking) portal built with React (Vite) and Google Apps Script.

## Project Structure
- `frontend/` - Vite React frontend (GitHub Pages ready)
- `apps-script/` - Google Apps Script backend (Code.gs + config)

## Frontend Setup (Local)
1. Copy `.env.example` to `.env` inside `frontend/` and set:
   - `VITE_API_BASE=<your Apps Script web app URL>`
2. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Apps Script Setup
Follow the full instructions in `apps-script/README.md`.

## Deploy to GitHub Pages
This repo is configured for GitHub Pages with base path `/nextreeScot/`.

1. Add a GitHub repository secret:
   - `VITE_API_BASE` = your Apps Script web app URL
2. Push to `main` (or run the workflow manually).
3. GitHub Actions builds `frontend/` and deploys to `gh-pages`.

## Environment Notes
- Google OAuth Client ID is baked into the frontend code.
- Apps Script verifies ID tokens via Google `tokeninfo` endpoint.
- By default, only `@ntwoods.com` emails are allowed (toggle `ALLOW_ANY_DOMAIN`).

## Recommended Checks
- Login with Google and confirm email is shown in the header.
- Verify follow-ups list includes only today or past dates for your email.
- Submit outcomes (NR/AI/OR/MD/SF) and confirm SCOT + Logs update.
- Confirm Orders Received panel updates after new OR entries.