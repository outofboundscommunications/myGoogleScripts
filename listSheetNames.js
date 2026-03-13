function listSheetNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  let output = "Sheet Name | Status\n";
  output += "--------------------------\n";

  sheets.forEach(sheet => {
    const name = sheet.getName();
    const status = sheet.isSheetHidden() ? "Hidden" : "Visible";
    output += `${name} - ${status}\n`;
  });

  Logger.log(output);
}
