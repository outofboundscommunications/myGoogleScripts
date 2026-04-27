function generateGamefoundReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metaSheet = ss.getSheetByName("raw_data_meta");
  const gfSheet = ss.getSheetByName("raw_data_Gamefound");
  const targetSheet = ss.getSheetByName("Consolidated Report") || ss.insertSheet("Consolidated Report");

  // 1. HARD LIMIT: Only grab the top 1000 rows. 
  // This bypasses the "million row" hang entirely.
  const metaData = metaSheet.getRange(1, 1, 1000, metaSheet.getLastColumn()).getValues();
  const gfData = gfSheet.getRange(1, 1, 100, gfSheet.getLastColumn()).getValues();

  const mHeaders = metaData[0];
  const gHeaders = gfData[0];
  const getCol = (headers, name) => headers.indexOf(name);

  const n = (val) => {
    if (typeof val === 'number') return val;
    let num = parseFloat(String(val).replace(/[$,]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  let finalRows = [];
  let sums = { reach:0, imps:0, spend:0, clicks:0, follows:0, f:[], ctr:[], cpf:[], cpc:[], cpm:[] };

  // 2. Process Meta
  for (let i = 1; i < metaData.length; i++) {
    let r = metaData[i];
    // STOP if the Month column is empty
    if (!r[getCol(mHeaders, "Month")]) break; 

    let rowValues = [
      r[getCol(mHeaders, "Month")], r[getCol(mHeaders, "Campaign name")], r[getCol(mHeaders, "Ad set name")], r[getCol(mHeaders, "Ad name")],
      n(r[getCol(mHeaders, "Reach")]), r[getCol(mHeaders, "Campaign Budget")], n(r[getCol(mHeaders, "Frequency")]),
      n(r[getCol(mHeaders, "Impressions")]), n(r[getCol(mHeaders, "Amount spent (USD)")]), n(r[getCol(mHeaders, "Link clicks")]),
      n(r[getCol(mHeaders, "CTR (all)")]), n(r[getCol(mHeaders, "follow")]), n(r[getCol(mHeaders, "Cost per follow")]),
      n(r[getCol(mHeaders, "CPC (cost per link click)")]), n(r[getCol(mHeaders, "CPM (cost per 1,000 impressions)")]), ""
    ];

    sums.reach += rowValues[4]; sums.imps += rowValues[7]; sums.spend += rowValues[8];
    sums.clicks += rowValues[9]; sums.follows += rowValues[11];
    sums.f.push(rowValues[6]); sums.ctr.push(rowValues[10]); sums.cpf.push(rowValues[12]);
    sums.cpc.push(rowValues[13]); sums.cpm.push(rowValues[14]);

    finalRows.push(rowValues);
  }

  // 3. Create Summary Row
  const avg = (arr) => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
  finalRows.push([
    "SUMMARY", "TOTALS / AVERAGES", "", "", sums.reach, "", avg(sums.f), sums.imps, 
    sums.spend, sums.clicks, avg(sums.ctr), sums.follows, avg(sums.cpf), avg(sums.cpc), avg(sums.cpm), ""
  ]);

  // 4. Add Gamefound Data
  for (let j = 1; j < gfData.length; j++) {
    let r = gfData[j];
    if (!r[0]) break; // Stop at empty row
    let gfRow = new Array(16).fill("");
    gfRow[0] = r[getCol(gHeaders, "Reporting Date")];
    gfRow[15] = r[getCol(gHeaders, "Total follows reported on GF page ")];
    finalRows.push(gfRow);
  }

  // 5. Output and Styling
  targetSheet.clear().clearFormats();
  const headers = ["Month", "Campaign name", "Ad set name", "Ad name", "Reach", "Campaign Budget", "Frequency", "Impressions", "Amount spent (USD)", "Link clicks", "CTR (all)", "follow", "Cost per follow", "CPC (cost per link click)", "CPM (cost per 1,000 impressions)", "GF Page Follows (a)"];
  targetSheet.getRange(1, 1, 1, 16).setValues([headers]).setFontWeight("bold");
  targetSheet.getRange(2, 1, finalRows.length, 16).setValues(finalRows);
  
  // Format the Summary Row (Dark Grey / White Text)
  let summaryIdx = finalRows.findIndex(row => row[0] === "SUMMARY") + 2;
  targetSheet.getRange(summaryIdx, 1, 1, 16).setBackground("#444444").setFontColor("white").setFontWeight("bold");
  
  // Apply Number Formats
  targetSheet.getRange("I:I").setNumberFormat("$#,##0.00"); // Spend
  targetSheet.getRange("M:O").setNumberFormat("$#,##0.00"); // Costs
  targetSheet.getRange("E:E").setNumberFormat("#,##0");     // Reach
  targetSheet.getRange("H:H").setNumberFormat("#,##0");     // Imps

  targetSheet.autoResizeColumns(1, 16);
  SpreadsheetApp.getUi().alert("Report updated successfully!");
}