# SCOT Apps Script Backend

## Setup
1. Go to https://script.google.com and create a new Apps Script project.
2. In the Apps Script editor:
   - Create a new file named `Code.gs` and paste the contents from `apps-script/Code.gs`.
   - Create `appsscript.json` and paste the contents from `apps-script/appsscript.json`.
3. Confirm these constants in `Code.gs`:
   - `SPREADSHEET_ID`: `1ECi7Tx3QWPjq8nWL1O_90UfUwFW7VvnZssx_KeOh09Y`
   - `SCOT_SHEET_NAME`: `SCOT`
   - `LOGS_SHEET_NAME`: `Logs`
   - `ALLOW_ANY_DOMAIN`: `false` (set to `true` to allow any email domain)

## Deploy as Web App
1. Click **Deploy** ? **New deployment**.
2. Select **Web app**.
3. Set **Execute as**: **Me**.
4. Set **Who has access**: **Anyone**.
5. Click **Deploy**, authorize, and copy the Web App URL.
6. Set the URL in the frontend `.env` as `VITE_API_BASE=<your web app url>`.

## Notes
- The script verifies Google ID tokens via `https://oauth2.googleapis.com/tokeninfo` and uses the verified email.
- Logs are appended into the `Logs` sheet (created automatically if missing).
- All date comparisons and formatting use the Asia/Kolkata timezone.