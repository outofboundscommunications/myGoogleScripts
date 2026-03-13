/***************
 * PMC Base Geocoder (ZIP-first)
 * Fills Base_Lat / Base_Lng columns in BASES_raw
 ***************/

const SHEET_NAME = "BASES_raw";
const HEADER_ROW = 1;

// Runs when the sheet opens: adds menu
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("PMC Tools")
    .addItem("Geocode BASES_raw (fill missing)", "geocodeBasesFillMissing")
    .addItem("Geocode selected rows only", "geocodeBasesSelectedRows")
    .addSeparator()
    .addItem("Reset geocode cache (advanced)", "resetGeocodeCache")
    .addToUi();
}

// Main: fills only rows missing lat/lng
function geocodeBasesFillMissing() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const data = sh.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1].map(h => String(h).trim());

  const colBaseName = findCol(headers, "Military Base Name");
  const colState    = findCol(headers, "State");
  const colZip      = findCol(headers, "Base_Zip");
  const colLat      = findCol(headers, "Base_Lat");
  const colLng      = findCol(headers, "Base_Lng");

  let updates = 0;

  for (let r = HEADER_ROW; r < data.length; r++) {
    const baseName = data[r][colBaseName];
    const state    = data[r][colState];
    const zip      = data[r][colZip];
    const lat      = data[r][colLat];
    const lng      = data[r][colLng];

    // Skip if already filled
    if (lat && lng) continue;

    const query = buildQuery(baseName, state, zip);
    const result = geocodeCached_(query);

    if (result && result.lat && result.lng) {
      sh.getRange(r + 1, colLat + 1).setValue(result.lat);
      sh.getRange(r + 1, colLng + 1).setValue(result.lng);
      updates++;
      Utilities.sleep(120); // rate-limit a bit
    }
  }

  SpreadsheetApp.getUi().alert(`Geocoding complete. Updated ${updates} row(s).`);
}

// Only geocode currently selected rows (for testing)
function geocodeBasesSelectedRows() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const range = sh.getActiveRange();
  const startRow = range.getRow();
  const numRows = range.getNumRows();

  const data = sh.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1].map(h => String(h).trim());

  const colBaseName = findCol(headers, "Military Base Name");
  const colState    = findCol(headers, "State");
  const colZip      = findCol(headers, "Base_Zip");
  const colLat      = findCol(headers, "Base_Lat");
  const colLng      = findCol(headers, "Base_Lng");

  let updates = 0;

  for (let sheetRow = startRow; sheetRow < startRow + numRows; sheetRow++) {
    if (sheetRow <= HEADER_ROW) continue;

    const r = sheetRow - 1; // data index
    const baseName = data[r][colBaseName];
    const state    = data[r][colState];
    const zip      = data[r][colZip];

    const query = buildQuery(baseName, state, zip);
    const result = geocodeCached_(query);

    if (result && result.lat && result.lng) {
      sh.getRange(sheetRow, colLat + 1).setValue(result.lat);
      sh.getRange(sheetRow, colLng + 1).setValue(result.lng);
      updates++;
      Utilities.sleep(120);
    }
  }

  SpreadsheetApp.getUi().alert(`Selected-row geocoding complete. Updated ${updates} row(s).`);
}

// Build a strong geocode query (ZIP-first)
function buildQuery(baseName, state, zip) {
  const parts = [];
  if (zip) parts.push(String(zip).trim());
  if (baseName) parts.push(String(baseName).trim());
  if (state) parts.push(String(state).trim());
  parts.push("USA");
  return parts.filter(Boolean).join(", ");
}

// Cache wrapper to reduce quota usage
function geocodeCached_(query) {
  const cache = CacheService.getScriptCache();
  const key = "geo_" + Utilities.base64EncodeWebSafe(query).slice(0, 200);

  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);

  const results = Maps.newGeocoder().geocode(query);
  if (!results || !results.results || !results.results.length) return null;

  const loc = results.results[0].geometry.location;
  const out = { lat: loc.lat, lng: loc.lng };

  cache.put(key, JSON.stringify(out), 21600); // 6 hours
  return out;
}

// Reset cache (mostly for debugging)
function resetGeocodeCache() {
  CacheService.getScriptCache().removeAll([]);
  SpreadsheetApp.getUi().alert("Cache reset (note: Apps Script cache may persist in some cases).");
}

// Find header column index (0-based), throws if missing
function findCol(headers, name) {
  const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
  if (idx === -1) throw new Error(`Missing required column header: ${name}`);
  return idx;
}
