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
  
   var spreadsheet = copySpreadsheet(SPREADSHEET_URL);
   var sheet = spreadsheet.getSheetByName('Report');
  
   function copySpreadsheet(spreadsheetUrl) {
      return SpreadsheetApp.openByUrl(spreadsheetUrl).copy(
       'Keyword Performance Report ' + new Date());
	   Logger.log('copied spreadsheet');
	}

  function outputData(sheet)	{
  // Output header row
  var header = [
    'AdGroup',
    'Campaign',
	'Query',
	'Clicks',
    'Impressions',
    'Cost',
	'Conversions'
  ];
  sheet.getRange(1, 1, 1, 7).setValues([header]);
    //output data to spreadsheet
  var rows = [];
  for (i=0; i<queries.length; i++)	{
	  var row =	[
	  	queries[i].AdGroupName,
		queries[i].CampaignName,
		queries[i].Query,
		queries[i].Clicks,
		queries[i].Impressions,
		queries[i].Costs,
		queries[i].Conversions];
	rows.push(row);
   }
   
   sheet.getRange(2, 1, rows.length, 7).setValues(rows);

  }
}
