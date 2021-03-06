// Keywords with our brand name are "branded" keywords
// we also label holiday keywords so we can manage those uniquely
// we also are creating a way to label non-brand keywords as well
// we do this by assuming any keywords not labeled as branded or holiday are you basic nonbranded keywords

//what we want to do now is get this script to run on a scheduled basis and update new keywords with
//labels and skip already labeled keywords

var BRAND_NAMES = ['posty' ];
var HOLIDAY_NAMES = ['holiday', 'christmas'];
var NON_BRANDED_NAMES = [ ] ;

function main() {
  //we comment out this createLabels() function since we only need to use it when creating labels
  //createLabels();

  labelHolidayKeywords();
  labelBrandedKeywords();
  labelNonBrandedKeywords();

}

// labeling function, run once to create labels
function createLabels() {
  AdWordsApp.createLabel('brand-keyword', 'Keywords that are part of our brand', 'blue');
  AdWordsApp.createLabel('holiday-keyword', 'Keywords that are holiday related', 'red');
}

/**
 * Returns true if this string is consider to be a part of our brand, false otherwise.
 */
function isBrand(s) {
  if (!s) {
    return false;
  }
  for (var i = 0; i < BRAND_NAMES.length; i++) {
    if (s.toLowerCase().indexOf(BRAND_NAMES[i].toLowerCase()) != -1) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if this string is consider to be a part of our holiday keywords, false otherwise.
 */
function isHoliday(s) {
  if (!s) {
    return false;
  }
  for (var i = 0; i < HOLIDAY_NAMES.length; i++) {
    if (s.toLowerCase().indexOf(HOLIDAY_NAMES[i].toLowerCase()) != -1) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if the keyword already has this label applied.
 */
function hasLabel(keyword, label) {
  return keyword.labels().withCondition("Name = '" + label + "'").get().hasNext();
}
  
// function to label keywords as holiday
function labelHolidayKeywords() {
  var keywordSelector = AdWordsApp.keywords()
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
  var keywordIterator = keywordSelector.get();  
  while (keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    //check if keyword is holiday by using isHoliday() function
    if (isHoliday(keyword.getText())) {
      //if not already labeled as holiday keyword, then label it as such
	  if (!hasLabel(keyword,'holiday-keyword'))	{
	  	keyword.applyLabel('holiday-keyword');
	  }
    }
  }
}

  
// function to label keywords as branded
function labelBrandedKeywords() {
  var keywordSelector = AdWordsApp.keywords()
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
  var keywordIterator = keywordSelector.get();  
  while (keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    //check if keyword is brand by using isBrand() function
    if (isBrand(keyword.getText())) {
		//if not already labeled as brand keyword, then label it as such
	  if (!hasLabel(keyword,'brand-keyword'))	{
      	keyword.applyLabel('brand-keyword');
	  }
    }
  }
}

// function to label keywords as non-branded
function labelNonBrandedKeywords() {
  var keywordSelector = AdWordsApp.keywords()
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
  var keywordIterator = keywordSelector.get();  
  while (keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    //check if keyword is brand by using isBrand() function
    if( (!isBrand(keyword.getText()) && (!isHoliday(keyword.getText())))) {
      //if not already labeled as non-brand keyword, then label it as such
	  	if (!hasLabel(keyword,'nonbrand-keyword'))	{
	  		keyword.applyLabel('nonbrand-keyword');
		}
    }
  }
}