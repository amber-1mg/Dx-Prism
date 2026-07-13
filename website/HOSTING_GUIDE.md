# Hosting and Integration Guide

This guide explains how to host your TATA 1mg Diagnostic Assistant frontend and connect it to your Google Sheet backend for quiz scores.

## 1. Backend Setup (Google Apps Script)

To connect the quiz results to your Google Sheet, follow these steps:

1. Open your Google Sheet: [1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE](https://docs.google.com/spreadsheets/d/1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE)
2. Go to **Extensions > Apps Script**.
3. Delete any code in the editor and paste the following:

```javascript
/**
 * App Script to handle Quiz Score submissions from the frontend.
 * Targeted at Sheet ID: 1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE
 * Tab Name: "Quiz Score"
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Quiz Score");
    
    // Create tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Quiz Score");
      sheet.appendRow(["Timestamp", "Username", "Segment", "Score"]);
    }
    
    var rowData = JSON.parse(e.postData.contents);
    
    // Append the data
    sheet.appendRow([
      rowData.timestamp || new Date().toISOString(),
      rowData.name || "Anonymous",
      rowData.segmentId || "N/A",
      rowData.score || 0
    ]);
    
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// Handle preflight CORS requests
function doOptions(e) {
  return ContentService.createTextOutput("OK");
}
```

4. Click **Deploy > New Deployment**.
5. Select **Type: Web App**.
6. Set **Description** to "Quiz Score Backend".
7. Set **Execute as** to "Me".
8. Set **Who has access** to **"Anyone"** (This is crucial for the frontend to communicate).
9. Click **Deploy**, authorize permissions, and **copy the Web App URL**.
10. In your frontend environment (or AI Studio Secrets), set `VITE_GOOGLE_SHEET_URL` to this URL.

## 2. Frontend Deployment

### Option A: Using the Build (Recommended)
1. In AI Studio, go to **Settings > Export to ZIP**.
2. Run `npm install` and `npm run build` locally.
3. The contents of the `dist/` folder are your ready-to-host website.
4. Upload these files to any static host (Netlify, Vercel, GitHub Pages, Firebase Hosting).

### Option B: Standalone HTML (Simplified)
If you want to wrap the app in an iframe or a simple HTML page, use the structure below. Note that since this is a React app, it requires the bundled JS files from the build step above.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TATA 1mg | Diagnostic Assistant</title>
    <!-- Include Tailwind via CDN if not using build system (optional for preview) -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div id="root">
        <!-- The React app will mount here after you build and include your scripts -->
    </div>
    
    <!-- In a real deployment, these would be your bundled asset scripts -->
    <!-- <script type="module" src="/assets/index-XXXX.js"></script> -->
    <p class="p-10 text-center text-gray-400 text-sm">
        Please use the "Export to ZIP" option in AI Studio to get the full source code and build assets.
    </p>
</body>
</html>
```

## 3. Knowledge Base Connection
The chatbot currently uses the Knowledge Base provided in the constant file, which was derived from:
`1GOBnibmbKd1ZdTNSOH2jAmaAw_aDYkzo`

If you update that sheet, you may want to refresh the `TEST_KNOWLEDGE_BASE` in `src/constants/testData.ts`.
