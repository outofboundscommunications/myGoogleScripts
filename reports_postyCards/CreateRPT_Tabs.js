/**
 * Creates the required reporting and input tabs if they do not already exist.
 */
function createReportingTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabsToCreate = [
    "RPT_Exec",
    "RPT_Ecomm",
    "RPT_Traffic",
    "RPT_MediaPlan",
    "RPT_Ads_Platform",
    "RPT_Google",
    "RPT_Meta",
    "RPT_Bing",
    "RPT_LinkedIn",
    "RPT_SEO",
    "RPT_CM360",
    "Insights_Input",
    "QA_Tab"
  ];

  tabsToCreate.forEach(sheetName => {
    // Check if the sheet already exists to avoid errors
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      ss.insertSheet(sheetName);
      console.log("Created: " + sheetName);
    } else {
      console.log("Skipped (already exists): " + sheetName);
    }
  });
}
