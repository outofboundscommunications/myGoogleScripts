/**
 * SEO Sheet Merger v2
 * Consolidates Batch 1, 2, and 3 with "seo_batch" as the first column.
 */

function mergeSEOSheets() {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Define the Source Files
  const sources = [
    {
      id: "13-KBakk9P4hlle3mDEbwgs0_JuJwf9MtwWOUx6pA7Ag", 
      batchLabel: "batch 1",
      tab: "Client copy of Priority Pages Optimization"
    },
    {
      id: "1aCUjKBT9t2z3QVv9T1BPjygyE4vNgSlLBQ22Q_syaIE", 
      batchLabel: "batch 2",
      tab: "Client copy of Priority Pages Optimization"
    },
    {
      id: "1LHFPKkUCw97gqLIUwK91zktjGQXpCwkMWIIlt9ljgbc", 
      batchLabel: "batch 3",
      tab: "Client copy of Priority Pages Optimization"
    }
  ];

  // Define the Master Headers (Column Order) - "seo_batch" is now first
  const masterHeaders = [
    "seo_batch", "url", "keywords", "old page title", "new page title", "new page title deployed?",
    "old meta description", "new meta description", "new meta description deployed?",
    "old seo_title", "new seo_title", "new seo_title deployed?",
    "old category_text", "new category_text", "new category_text deployed?",
    "old category_seo_text_header", "new category_seo_text_header", "new category_seo_text_header deployed?",
    "old category_seo_text", "new category_seo_text", "new category_seo_text deployed?"
  ];

  // Mapping Logic for different naming conventions
  const mapping = {
    "url": ["url"],
    "keywords": ["keywords"],
    "old page title": ["OLD Page Title", "PAGE_TITLE (OLD)"],
    "new page title": ["NEW Page Title", "PAGE_TITLE (NEW)"],
    "new page title deployed?": ["New Page Title Deployed?"],
    "old meta description": ["OLD Meta Description", "META_DESCRIPTION (OLD)"],
    "new meta description": ["NEW Meta Description", "META_DESCRIPTION (NEW)"],
    "new meta description deployed?": ["New Meta Description Deployed?"],
    "old seo_title": ["SEO_TITLE", "TITLE (OLD)"],
    "new seo_title": ["NEW SEO_TITLE", "SEO_TITLE (NEW)"],
    "new seo_title deployed?": ["New SEO_TITLE Deployed?"],
    "old category_text": ["CATEGORY_TEXT (OLD)"],
    "new category_text": ["CATEGORY_TEXT (NEW)"],
    "new category_text deployed?": ["New CATEGORY_TEXT Deployed?"],
    "old category_seo_text_header": ["CATEGORY_SEO_TEXT_HEADER (OLD)"],
    "new category_seo_text_header": ["CATEGORY_SEO_TEXT_HEADER (NEW)"],
    "new category_seo_text_header deployed?": ["New CATEGORY_SEO_TEXT_HEADER Deployed?"],
    "old category_seo_text": ["OLD Category SEO Text", "CATEGORY_SEO_TEXT (OLD)"],
    "new category_seo_text": ["NEW Category SEO Text", "CATEGORY_SEO_TEXT (NEW)"],
    "new category_seo_text deployed?": ["New Category SEO Text Deployed?"]
  };

  let finalData = [];
  let processedUrls = new Set(); 

  sources.forEach(source => {
    try {
      const ss = SpreadsheetApp.openById(source.id);
      const sheet = ss.getSheetByName(source.tab);
      const data = sheet.getDataRange().getValues();
      const headers = data.shift(); 

      // Clean headers to handle any hidden spaces
      const cleanHeaders = headers.map(h => h.toString().trim());

      data.forEach(row => {
        let rowObj = {};
        cleanHeaders.forEach((h, index) => {
          rowObj[h] = row[index];
        });

        const urlValue = rowObj["url"];
        if (!urlValue || processedUrls.has(urlValue)) return;

        let newRow = [];
        // Loop through master headers to build the row in correct order
        masterHeaders.forEach(mHeader => {
          if (mHeader === "seo_batch") {
            newRow.push(source.batchLabel);
          } else {
            let foundValue = "";
            const possibleNames = mapping[mHeader];
            if (possibleNames) {
              for (let name of possibleNames) {
                if (rowObj[name] !== undefined) {
                  foundValue = rowObj[name];
                  break;
                }
              }
            }
            newRow.push(foundValue);
          }
        });

        finalData.push(newRow);
        processedUrls.add(urlValue);
      });
    } catch (e) {
      Logger.log("Error processing " + source.batchLabel + ": " + e.message);
    }
  });

  // Output results
  masterSheet.clear();
  masterSheet.getRange(1, 1, 1, masterHeaders.length)
             .setValues([masterHeaders])
             .setFontWeight("bold")
             .setBackground("#f3f3f3");
             
  if (finalData.length > 0) {
    masterSheet.getRange(2, 1, finalData.length, masterHeaders.length).setValues(finalData);
    masterSheet.setFrozenRows(1); // Freeze the header row for better UX
  }
  
  SpreadsheetApp.getUi().alert("Merge Successful! " + finalData.length + " unique rows imported.");
}