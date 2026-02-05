/**
 * Creates quarterly calendar sheets based on the '2026 Content Calendar – Publishing Log' sheet.
 */
function createQuarterlyCalendars() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("2026 Content Calendar – Publishing Log");
  
  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Error: '2026 Content Calendar – Publishing Log' sheet not found.");
    return;
  }

  // Get data from the source sheet, skipping the header (row 1 is title, row 2-3 are headers/breaks)
  const data = sourceSheet.getRange(5, 1, sourceSheet.getLastRow() - 4, 12).getValues();
  
  const quarters = [
    { name: "Q1 2026", months: [0, 1, 2] },
    { name: "Q2 2026", months: [3, 4, 5] },
    { name: "Q3 2026", months: [6, 7, 8] },
    { name: "Q4 2026", months: [9, 10, 11] }
  ];

  quarters.forEach(q => {
    let qSheet = ss.getSheetByName(q.name);
    if (qSheet) ss.deleteSheet(qSheet);
    qSheet = ss.insertSheet(q.name);
    
    let currentRow = 1;
    
    q.months.forEach(monthIdx => {
      const year = 2026;
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, monthIdx));
      
      // Month Header
      qSheet.getRange(currentRow, 1, 1, 7).merge().setValue(monthName + " " + year)
            .setBackground("#4a86e8").setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center");
      currentRow++;
      
      // Day Headers
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      qSheet.getRange(currentRow, 1, 1, 7).setValues([days]).setBackground("#eeeeee").setFontWeight("bold");
      currentRow++;

      const firstDay = new Date(year, monthIdx, 1).getDay();
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      
      let dayCounter = 1;
      for (let i = 0; i < 6; i++) { // Up to 6 weeks
        for (let j = 0; j < 7; j++) {
          if ((i === 0 && j >= firstDay) || (i > 0 && dayCounter <= daysInMonth)) {
            const currentCell = qSheet.getRange(currentRow + i, j + 1);
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
            
            // Find content for this date
            let cellText = dayCounter + "\n";
            data.forEach(row => {
              const postDate = row[3]; // posting_date_2026 column
              const title = row[5];    // topic_title column
              
              if (postDate instanceof Date) {
                const formattedDate = Utilities.formatDate(postDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
                if (formattedDate === dateStr) {
                  cellText += "• " + title + "\n";
                }
              }
            });

            currentCell.setValue(cellText).setVerticalAlignment("top").setWrap(true);
            dayCounter++;
          }
        }
        if (dayCounter > daysInMonth) break;
      }
      
      // Formatting
      qSheet.getRange(currentRow - 1, 1, 7, 7).setBorder(true, true, true, true, true, true);
      currentRow += 7; // Move to next month block
    });
    
    qSheet.setColumnWidths(1, 7, 150);
    qSheet.getRange("1:100").setVerticalAlignment("top");
  });
}