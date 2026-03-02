
🚀 SEO Data Merger (Google Apps Script)
This repository contains a Google Apps Script designed to consolidate SEO keyword mapping data from three disparate Google Sheets into a single "Master" destination sheet.

📌 Project Overview
The script identifies columns across multiple files—even when named differently (e.g., OLD Page Title vs PAGE_TITLE (OLD))—and maps them to a uniform structure. It includes automatic deduplication based on the url column.

🛠 Mapping Logic
Deduplication: Uses a Set object to ensure each URL only appears once.

Batch Labeling: Automatically adds a seo_batch column (Column A) to track the data source.

Flexible Headers: Lookups are case-insensitive and handle trailing spaces.

🏃 How to Run the Script
Create a Destination Sheet: Open a new Google Sheet.

Open Script Editor: Go to Extensions > Apps Script.

Paste Code: Copy the contents of Code.js into the editor.

Authorize: Click Run. You must "Review Permissions" and allow access to your Google Drive/Sheets.

Output: The script will clear the active sheet and build the master list from scratch.

⚙️ Managing the Project with clasp
This project uses @google/clasp to sync local code with the Google Cloud.

Update appsscript.json
If you add new Google services (like Drive API), you must update the manifest:

Open appsscript.json.

Ensure the oauthScopes cover the necessary permissions:

JSON
"oauthScopes": [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly"
]
Run clasp push to update the script settings in the cloud.

⚠️ What to Avoid (The "Gotchas")
Avoid clasp push without clasp pull: If you make a quick change in the browser editor, pull it first. Running push will overwrite the browser code with your local files, potentially deleting unsaved changes.

Sensitive Data: Never commit .clasprc.json to GitHub. This file contains your Google login tokens. Ensure it is in your .gitignore.

Column Name Changes: If the source sheets change their header names, you must update the mapping object in Code.js, or the script will return empty strings for those columns.

Large Datasets: Google Apps Script has a 6-minute execution limit. If your sheets grow to 20,000+ rows, the script may need to be optimized for "Batch" processing.

🔄 Daily Workflow
Activate Environment: source .venv/bin/activate

Fetch Latest: git pull origin main

Edit Code: Use VS Code or vi.

Deploy to Google: clasp push


