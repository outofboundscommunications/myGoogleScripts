// Minimum number of data points and conversions for a keyword to consider 'enough data'
// and to make an educated decision
 var CONVERSION_THRESHOLD = 0;
// If our conversion cost isn't too high, it'll become a positive keyword.
var COST_PER_CONVERSION_THRESHOLD = 30; // $30
// needs to be a query found from an active campaign and ad group
var CAMPAIGN_STATUS= "ACTIVE";
var ADGROUP_STATUS = "ENABLED";

// Comma-separated list of recipients.
var RECIPIENT_EMAIL = 'jayw@outofboundscommunications.com';
// Spreadsheet template.
var SPREADSHEET_URL = 'https://docs.google.com/spreadsheet/ccc?key=0Aofty_0xxQLJdG41cTBSOTgxQ3lpM3dkYWNlMEkwYWc#gid=0';

function main() {
 
  //define array of query objects
  var queries =[];
  
  //create query object constructor
  function SearchQuery(AdGroupName,CampaignName,Query,Clicks,Impressions) {
    this.AdGroupName = AdGroupName;
    this.CampaignName = CampaignName;
    this.Query = Query;
    this.Clicks = Clicks;
    this.Impressions = Impressions;
    this.Costs = Costs;
    this.Conversions = Conversions;
    this.CostPerConversion = CostPerConversion;
    this.ConversionRate = ConversionRate;
  }
  
    var report = AdWordsApp.report(
      "SELECT AdGroupName, CampaignName, Query, Clicks,Impressions, Cost,Conversions,CostPerConversion,ConversionRate " +
      "FROM   SEARCH_QUERY_PERFORMANCE_REPORT " +
      "WHERE Conversions > " + CONVERSION_THRESHOLD +
      " DURING LAST_30_DAYS");
  
  var rows = report.rows();
  while (rows.hasNext()) {
    var row = rows.next();
    var AdGroupName = row['AdGroupName'];
    var CampaignName = row['CampaignName'];
    var Query = row['Query'];
    var Clicks = row['Clicks'];
    var Impressions = row['Impressions'];
    var Costs = row['Cost'];
    var Conversions = row['Conversions'];
    var CostPerConversion = row['CostPerConversion'];
    var ConversionRate = row['ConversionRate'];
    if (CostPerConversion < COST_PER_CONVERSION_THRESHOLD){
      var myQueryItem = new SearchQuery(AdGroupName,CampaignName,Query,Clicks,Impressions,Costs,Conversions,CostPerConversion,ConversionRate);
      queries.push(myQueryItem);
    }
  }
  Logger.log(queries);
  for (i=0; i<queries.length; i++){
    Logger.log("Query: " + queries[i].Query + " CampaignName: " + queries[i].CampaignName + " CPA: " + queries[i].CostPerConversion);
  }
  
  var now = new Date();
  var reportName = "SETSearchQueryReport-" + Utilities.formatDate(now, "CST", "yyyyMMdd");
  // Create a new spreadsheet (will have private access for you only).
  var spreadsheet = SpreadsheetApp.create(reportName);
  // Get the default sheet.
  var sheet = spreadsheet.getActiveSheet();
  // Write header row.
  sheet.getRange("A1").setValue("adGroupName");
  sheet.getRange("B1").setValue("CampaignName");
  sheet.getRange("C1").setValue("Query");
  sheet.getRange("D1").setValue("Clicks");
  sheet.getRange("E1").setValue("Conversions");

  // Write body of report.
  for (var row = 2; row <= queries.length; row ++) {

    sheet.getRange("A" + row).setValue(queries[row].AdGroupName);
    sheet.getRange("B" + row).setValue(queries[row].CampaignName);
    sheet.getRange("C" + row).setValue(queries[row].Query);
    sheet.getRange("D" + row).setValue(queries[row].Clicks);
	sheet.getRange("E" + row).setValue(queries[row].Conversions);
  }

  Logger.log("Report ready! Visit the following URL to see it:");
  Logger.log("https://docs.google.com/spreadsheet/ccc?key=" + spreadsheet.getId());

}
