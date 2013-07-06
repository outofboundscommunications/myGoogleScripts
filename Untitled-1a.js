// Minimum number of data points and conversions for a keyword to consider 'enough data'
// and to make an educated decision
 var CONVERSION_THRESHOLD = 0;
// If our conversion cost isn't too high, it'll become a positive keyword.
var COST_PER_CONVERSION_THRESHOLD = 30; // $30

// Comma-separated list of recipients.
var RECIPIENT_EMAIL = 'jayw@outofboundscommunications.com';
// Spreadsheet template.
var SPREADSHEET_URL = 'https://docs.google.com/spreadsheet/ccc?key=0Aofty_0xxQLJdG41cTBSOTgxQ3lpM3dkYWNlMEkwYWc#gid=0';

/**
 * This script computes a search query report
 * and outputs it to a Google spreadsheet. The spreadsheet
 * url is logged and emailed.
 */
function main() {
  var spreadsheet = copySpreadsheet(SPREADSHEET_URL);
  var sheet = spreadsheet.getSheetByName('Report');
  
  runSearchQueryReport();

  Logger.log('Search Query Report - ' + spreadsheet.getUrl());
  /**MailApp.sendEmail(
    RECIPIENT_EMAIL, 'New Search Query Report for SET is ready.', spreadsheet.getUrl());
    */
}

// make a copy of the spreadsheet each time the script runs
function copySpreadsheet(spreadsheetUrl) {
  return SpreadsheetApp.openByUrl(spreadsheetUrl).copy(
    'Search Query Report for SET ' + new Date());
}

function outputSearchQueryData(sheet) {
  // Output header row
  var header = [
    'Campaign',
    'AdGroup',
    'Query',
    'Impressions',
    'Clicks',
    'Conversions',
    'Cost',
    'CPA',
    '%Conv'
  ];
  sheet.getRange(1, 1, 1, 9).setValues([header]);

}

function runSearchQueryReport(){
  //now we run a SQR report for any queries
  //that meet our performance criteria (see above at top)
    
  //define object to hold queries that meet criteria
  var positiveKeywords = {};
  //define object to hold all the ad group ids of those queries
  var allAdGroupIds = {};
  var mySQRreport = AdWordsApp.report(
      "SELECT Query,Clicks,Cost,Ctr,ConversionRate,CostPerConversion,Conversions,CampaignName,AdGroupName " +
      "FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
      "WHERE " +
          "Conversions > " + CONVERSION_THRESHOLD +
      " DURING LAST_30_DAYS");
   
  var rows = mySQRreport.rows();
  
   // Iterate through search query and decide whether to
   // add them as positive keywords (or ignore).
   while (rows.hasNext()) {
      var row = rows.next();
      if (parseFloat(row['CostPerConversion']) < COST_PER_CONVERSION_THRESHOLD) {
        //addToMultiMap(positiveKeywords, row['AdGroupId'], row['Query']);
        addToMultiMap(positiveKeywords, row[''], row['AdGroupName'], row['Query'],row['Impressions'],row['Clicks'],
                      row['Conversions'],row['Cost'],row['CostPerConversion'],row['ConversionRate']);
        Logger.log("the campaign where the query was found: " + row['CampaignName'] + ", the ad group where the query was found: " + 
                   row['AdGroupName'] +", the query is: " + 
                   row['Query'] + " and the cpa is: $" + row['CostPerConversion']);
        allAdGroupIds[row['AdGroupId']] = true;
      }
   }
  
  Logger.log(positiveKeywords);
}

function addToMultiMap(map, key, value) {
  if (!map[key]) {
    map[key] = [];
  }
  map[key].push(value);
}

