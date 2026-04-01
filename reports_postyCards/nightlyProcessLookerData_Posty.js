function nightlyProcessLookerData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const importSheet = ss.getSheetByName("Import Mega Daily Cost Table w/ ROAS Data");
  const finalSheet = ss.getSheetByName("Final Import Mega Daily Costs_Roas");
  
  if (!importSheet || !finalSheet) {
    Logger.log("Check sheet names! One is missing.");
    return;
  }

  // 1. Clear the Final sheet to start fresh (keeps it in sync with ImportRange)
  finalSheet.clear();

  // 2. Get all data from the ImportRange sheet
  const importData = importSheet.getDataRange().getValues();
  const headers = importData[0];
  const dateColIndex = headers.indexOf("date");

  // 3. Create the new header row for the Final sheet
  // We'll put Year and Month at the front (Cols A & B)
  const newHeaders = ["Year", "Month", ...headers];
  const outputData = [newHeaders];

  // 4. Loop through data rows (skip header)
  for (let i = 1; i < importData.length; i++) {
    const row = importData[i];
    const rawDate = row[dateColIndex];
    
    let year = "";
    let month = "";

    if (rawDate instanceof Date) {
      year = rawDate.getFullYear();
      month = rawDate.getMonth() + 1; // Corrects 0-indexed months
    } else if (rawDate !== "") {
      // Fallback if date is a string
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate)) {
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth() + 1;
      }
    }

    // Combine Year, Month, and the original row data
    outputData.push([year, month, ...row]);
  }

  // 5. Write everything to the Final sheet in one batch
  finalSheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
  Logger.log("Success: Data moved to Final Import Mega Daily Costs_Roas.");
}