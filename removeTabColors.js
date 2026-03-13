/**
 * Removes the background color from all sheet tabs in the spreadsheet.
 */
function removeTabColors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    // Setting tab color to null resets it to default
    sheet.setTabColor(null);
  });
  
  SpreadsheetApp.getUi().alert('All tab colors have been removed.');
}