function downloadImagesFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); // Runs on the currently open sheet
  const data = sheet.getDataRange().getValues();
  
  // 1. Create a folder in Google Drive to store the images
  const folderName = "Downloaded_DF_Creatives_" + new Date().getTime();
  const folder = DriveApp.createFolder(folderName);
  
  Logger.log("Starting download. Files will be saved in: " + folderName);

  // 2. Loop through rows (starting at index 1 to skip headers)
  for (let i = 1; i < data.length; i++) {
    const imageUrl = data[i][16]; // Column Q is index 16
    const fileName = data[i][15] || "Image_" + i; // Column P (index 15) for name, or fallback
    
    if (imageUrl && imageUrl.toString().includes("http")) {
      try {
        // Fetch the image data
        const response = UrlFetchApp.fetch(imageUrl);
        const blob = response.getBlob().setName(fileName);
        
        // Save to the new Drive folder
        folder.createFile(blob);
        Logger.log("Downloaded: " + fileName);
      } catch (e) {
        Logger.log("Failed to download row " + (i + 1) + ": " + e.message);
      }
    }
  }
  
  SpreadsheetApp.getUi().alert("Download Complete! Images saved to folder: " + folderName);
}