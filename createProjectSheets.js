/**
 * Creates a predefined list of sheets if they do not already exist.
 */
function createProjectSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // List of sheet names to create
  const sheetNames = [
    "RAW_GA4", "RAW_GoogleAds", "RAW_MetaAds", "RAW_GSC", "RAW_Budget",
    "KPI_Traffic", "KPI_PaidMedia", "KPI_SEO", "KPI_Budget",
    "Report_Output__Traffic", "Report_Output__Budget", "Report_Output__GoogleAds", 
    "Report_Output__MetaAds", "Report_Output__SEO", "Report_Output__ExecSummary_Data",
    "Insights_Input", "QA_Check", "Report_Map"
  ];
  
  sheetNames.forEach(name => {
    // Check if sheet already exists to avoid errors
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
      Logger.log("Created sheet: " + name);
    } else {
      Logger.log("Sheet already exists: " + name);
    }
  });
  
  SpreadsheetApp.getUi().alert("Sheet setup complete!");
}
