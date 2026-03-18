function showBoundSpreadsheetInfo() {
  const ss = SpreadsheetApp.getActive();
  Logger.log('Name: ' + ss.getName());
  Logger.log('ID: ' + ss.getId());
  SpreadsheetApp.getUi().alert('Bound spreadsheet: ' + ss.getName() + '\nID: ' + ss.getId());
}