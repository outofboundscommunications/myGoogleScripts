/*******************************************************
 * PMC Method 2 — Score scholarship candidates
 * and build Scholarship_Page_Top3_IPEDS (top 3 URLs per school).
 *
 * INPUT SHEETS
 * - SERP_results_IPEDS_norm
 * - SCHOOLS_raw_IPEDS
 *
 * OUTPUT SHEETS
 * Scholarship_Page_Candidates_IPEDS
 * Scholarship_Page_Top3_IPEDS
 *******************************************************/

const CFG = {
  serpNormSheet: 'SERP_results_IPEDS_norm',
  schoolsSheet: 'SCHOOLS_raw_IPEDS',
  candidatesSheet: 'Scholarship_Page_Candidates_IPEDS',
  outreachSheet: 'Scholarship_Page_Top3_IPEDS',
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PMC Tools')
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu('Method 2')
        .addItem('Score scholarship candidates', 'scoreScholarshipCandidates')
        .addItem('Build Scholarship_Page_Top3_IPEDS', 'buildMethod2OutreachTop3')
        .addItem('Run both Method 2 steps', 'runMethod2Top3Pipeline')
    )
    .addToUi();
}

function runMethod2Top3Pipeline() {
  scoreScholarshipCandidates();
  buildScholarshipPageTop3();
  SpreadsheetApp.getUi().alert('Method 2 pipeline complete.');
}

/**
 * Step 1:
 * Read SERP_results_IPEDS_norm
 * Score each candidate URL
 * Write scored rows to Scholarship_Page_Candidates_IPEDS
 * Sort rows before output
 * Write in chunks instead of one giant setValues()
 */

function scoreScholarshipCandidates() {
  const ss = SpreadsheetApp.getActive();
  Logger.log('Spreadsheet: ' + ss.getName());

  const sh = ss.getSheetByName(CFG.serpNormSheet);
  if (!sh) throw new Error(`Missing sheet: ${CFG.serpNormSheet}`);

  const data = sh.getDataRange().getValues();
  Logger.log('Rows in norm sheet: ' + data.length);

  if (data.length < 2) throw new Error(`${CFG.serpNormSheet} has no data.`);

  const headers = data[0].map(String);
  Logger.log('Headers: ' + JSON.stringify(headers));

  const rows = data.slice(1);
  const idx = makeHeaderMap(headers);

  const outHeaders = [
    'Base_RowID',
    'UNITID',
    'Domain',
    'QueryType',
    'Query',
    'position',
    'title',
    'url',
    'description',
    'displayedUrl',
    'date',
    'Score',
    'Reason_Positive',
    'Reason_Negative',
    'Keep_Candidate',
    'Candidate_Key'
  ];

  const out = [];

  for (const row of rows) {
    const baseRowId = val(row, idx, 'Base_RowID');
    const unitId = val(row, idx, 'UNITID');
    const domain = val(row, idx, 'Domain');
    const queryType = val(row, idx, 'QueryType');
    const query = val(row, idx, 'Query');
    const position = parseIntSafe(val(row, idx, 'position'));
    const title = val(row, idx, 'title');
    const url = val(row, idx, 'url');
    const description = val(row, idx, 'description');
    const displayedUrl = val(row, idx, 'displayedUrl');
    const date = val(row, idx, 'date');

    if (!unitId || !url) continue;

    const scoreObj = scoreCandidate({
      queryType,
      position,
      title,
      url,
      description,
      domain
    });

    const candidateKey = `${unitId}||${url}`;

    out.push([
      baseRowId,
      unitId,
      domain,
      queryType,
      query,
      position,
      title,
      url,
      description,
      displayedUrl,
      date,
      scoreObj.score,
      scoreObj.positive.join(' | '),
      scoreObj.negative.join(' | '),
      scoreObj.keep ? 'YES' : 'NO',
      candidateKey
    ]);
  }

  Logger.log('Output rows to write: ' + out.length);

  out.sort((a, b) => {
    const unitA = String(a[1] || '');
    const unitB = String(b[1] || '');
    if (unitA !== unitB) return unitA.localeCompare(unitB);

    const scoreA = Number(a[11] || 0);
    const scoreB = Number(b[11] || 0);
    if (scoreA !== scoreB) return scoreB - scoreA;

    const posA = Number(a[5] || 999);
    const posB = Number(b[5] || 999);
    return posA - posB;
  });

  const outSheet = getOrCreateSheet_(ss, CFG.candidatesSheet);
  outSheet.clearContents();
  outSheet.getRange(1, 1, 1, outHeaders.length).setValues([outHeaders]);

  if (out.length) {
    writeRowsInChunks_(outSheet, out, 2, 1, 500);
  }

  Logger.log('Write complete.');
}
/**
 * Step 2:
 * Read Scholarship_Page_Candidates_IPEDS and SCHOOLS_raw_IPEDS
 * Keep top 3 URLs per UNITID
 * Write final top-3 rows to Scholarship_Page_Top3_IPEDS
 */
function buildScholarshipPageTop3() {
  const ss = SpreadsheetApp.getActive();

  const candSh = ss.getSheetByName(CFG.candidatesSheet);
  if (!candSh) throw new Error(`Missing sheet: ${CFG.candidatesSheet}`);

  const schoolsSh = ss.getSheetByName(CFG.schoolsSheet);
  if (!schoolsSh) throw new Error(`Missing sheet: ${CFG.schoolsSheet}`);

  const candData = candSh.getDataRange().getValues();
  if (candData.length < 2) throw new Error(`${CFG.candidatesSheet} has no data.`);

  const schoolData = schoolsSh.getDataRange().getValues();
  if (schoolData.length < 2) throw new Error(`${CFG.schoolsSheet} has no data.`);

  const candHeaders = candData[0].map(String);
  const candRows = candData.slice(1);
  const cidx = makeHeaderMap(candHeaders);

  const schoolHeaders = schoolData[0].map(String);
  const schoolRows = schoolData.slice(1);
  const sidx = makeHeaderMap(schoolHeaders);

  // Build school lookup by UNITID
  const schoolByUnit = new Map();
  for (const row of schoolRows) {
    const unitId = val(row, sidx, 'UNITID');
    if (!unitId) continue;

    // Keep first row encountered for UNITID.
    // If same UNITID appears multiple times for multiple bases, this preserves the existing row.
    if (!schoolByUnit.has(unitId)) {
      schoolByUnit.set(unitId, {
        baseRowId: val(row, sidx, 'Base_RowID'),
        militaryBaseName: val(row, sidx, 'Military Base Name'),
        nearestBaseZip: val(row, sidx, 'Nearest Base Zip'),
        schoolName: val(row, sidx, 'School Name'),
        schoolCity: val(row, sidx, 'School City'),
        schoolState: val(row, sidx, 'School State'),
        schoolZip: val(row, sidx, 'School Zip'),
        schoolWebsite: val(row, sidx, 'School Website'),
        distanceMi: val(row, sidx, 'Distance_mi'),
        adminUrl: val(row, sidx, 'Admin URL'),
        finAidUrl: val(row, sidx, 'Financial Aid URL'),
        applyUrl: val(row, sidx, 'Apply URL'),
        netPriceUrl: val(row, sidx, 'Net Price URL'),
        veteransUrl: val(row, sidx, 'Veterans URL'),
        athleticsUrl: val(row, sidx, 'Athletics URL'),
        disabilityUrl: val(row, sidx, 'Disability Services URL')
      });
    }
  }

  // Group candidates by UNITID, dedupe by URL, keep YES only
  const byUnit = new Map();

  for (const row of candRows) {
    const keep = val(row, cidx, 'Keep_Candidate');
    if (String(keep).toUpperCase() !== 'YES') continue;

    const unitId = val(row, cidx, 'UNITID');
    const url = val(row, cidx, 'url');
    if (!unitId || !url) continue;

    if (!byUnit.has(unitId)) byUnit.set(unitId, new Map());

    const score = parseFloatSafe(val(row, cidx, 'Score'));
    const existing = byUnit.get(unitId).get(url);

    const payload = {
      baseRowId: val(row, cidx, 'Base_RowID'),
      domain: val(row, cidx, 'Domain'),
      queryType: val(row, cidx, 'QueryType'),
      query: val(row, cidx, 'Query'),
      position: parseIntSafe(val(row, cidx, 'position')),
      title: val(row, cidx, 'title'),
      url: url,
      description: val(row, cidx, 'description'),
      score: score,
      posReason: val(row, cidx, 'Reason_Positive'),
      negReason: val(row, cidx, 'Reason_Negative')
    };

    // Keep best score if same URL appears multiple times
    if (!existing || payload.score > existing.score) {
      byUnit.get(unitId).set(url, payload);
    }
  }

  const outHeaders = [
    'Base_RowID',
    'Military Base Name',
    'Nearest Base Zip',
    'UNITID',
    'School Name',
    'School City',
    'School State',
    'School Zip',
    'School Website',
    'Distance_mi',
    'Admin URL',
    'Financial Aid URL',
    'Apply URL',
    'Net Price URL',
    'Veterans URL',
    'Athletics URL',
    'Disability Services URL',
    'Top_URL_1',
    'Top_URL_1_Title',
    'Top_URL_1_Score',
    'Top_URL_2',
    'Top_URL_2_Title',
    'Top_URL_2_Score',
    'Top_URL_3',
    'Top_URL_3_Title',
    'Top_URL_3_Score',
    'Needs_Manual_Review',
    'Notes'
  ];

  const out = [];

  for (const [unitId, urlMap] of byUnit.entries()) {
    const school = schoolByUnit.get(unitId);
    if (!school) continue;

    const arr = Array.from(urlMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.position !== b.position) return a.position - b.position;
        return String(a.url).localeCompare(String(b.url));
      });

    const top1 = arr[0] || blankCandidate_();
    const top2 = arr[1] || blankCandidate_();
    const top3 = arr[2] || blankCandidate_();

    const needsReview = arr.length === 0 ? 'YES' : 'NO';

    out.push([
      school.baseRowId,
      school.militaryBaseName,
      school.nearestBaseZip,
      unitId,
      school.schoolName,
      school.schoolCity,
      school.schoolState,
      school.schoolZip,
      school.schoolWebsite,
      school.distanceMi,
      school.adminUrl,
      school.finAidUrl,
      school.applyUrl,
      school.netPriceUrl,
      school.veteransUrl,
      school.athleticsUrl,
      school.disabilityUrl,
      top1.url,
      top1.title,
      top1.score,
      top2.url,
      top2.title,
      top2.score,
      top3.url,
      top3.title,
      top3.score,
      needsReview,
      ''
    ]);
  }

  const outSheet = getOrCreateSheet_(ss, CFG.outreachSheet);

  outSheet.clearContents();
  outSheet.getRange(1, 1, 1, outHeaders.length).setValues([outHeaders]);

  if (out.length) {
    writeRowsInChunks_(outSheet, out, 2, 1, 500);
  }

  Logger.log('Write complete.');

}

/**
 * Candidate scoring logic
 * Simple and explainable.
 */
function scoreCandidate(item) {
  const url = String(item.url || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const desc = String(item.description || '').toLowerCase();
  const queryType = String(item.queryType || '').toUpperCase();
  const position = item.position || 999;

  let score = 0;
  const positive = [];
  const negative = [];
  let keep = true;

  // Query type preference
  if (queryType === 'Q1') {
    score += 30;
    positive.push('Q1');
  } else if (queryType === 'Q2') {
    score += 15;
    positive.push('Q2');
  } else if (queryType === 'Q3') {
    score += 8;
    positive.push('Q3');
  }

  // Position preference
  if (position === 1) {
    score += 10;
    positive.push('pos1');
  } else if (position === 2) {
    score += 8;
    positive.push('pos2');
  } else if (position === 3) {
    score += 6;
    positive.push('pos3');
  } else if (position >= 4 && position <= 5) {
    score += 4;
    positive.push('pos4-5');
  }

  // Positive URL / title / description signals
  addIfContains_(url, 'external', 20, positive, 'url:external', v => score += v);
  addIfContains_(url, 'outside', 20, positive, 'url:outside', v => score += v);
  addIfContains_(url, 'private', 15, positive, 'url:private', v => score += v);
  addIfContains_(url, 'scholar', 15, positive, 'url:scholar', v => score += v);
  addIfContains_(url, 'financial-aid', 10, positive, 'url:financial-aid', v => score += v);
  addIfContains_(url, 'financial_aid', 10, positive, 'url:financial_aid', v => score += v);
  addIfContains_(url, 'finaid', 8, positive, 'url:finaid', v => score += v);
  addIfContains_(url, 'veteran', 6, positive, 'url:veteran', v => score += v);
  addIfContains_(url, 'military', 6, positive, 'url:military', v => score += v);

  addIfContains_(title, 'external scholarship', 18, positive, 'title:external scholarship', v => score += v);
  addIfContains_(title, 'outside scholarship', 18, positive, 'title:outside scholarship', v => score += v);
  addIfContains_(title, 'private scholarship', 12, positive, 'title:private scholarship', v => score += v);
  addIfContains_(title, 'scholarship', 10, positive, 'title:scholarship', v => score += v);
  addIfContains_(desc, 'external scholarship', 8, positive, 'desc:external scholarship', v => score += v);
  addIfContains_(desc, 'outside scholarship', 8, positive, 'desc:outside scholarship', v => score += v);

  // Negative signals
  score = penalizeIfContains_(url, '.pdf', 30, negative, 'url:pdf', score);
  score = penalizeIfContains_(url, 'archive', 20, negative, 'url:archive', score);
  score = penalizeIfContains_(url, 'faculty', 30, negative, 'url:faculty', score);
  score = penalizeIfContains_(url, 'directory', 30, negative, 'url:directory', score);
  score = penalizeIfContains_(url, 'news', 20, negative, 'url:news', score);
  score = penalizeIfContains_(url, 'uploads', 20, negative, 'url:uploads', score);
  score = penalizeIfContains_(url, 'job', 25, negative, 'url:job', score);
  score = penalizeIfContains_(url, 'employment', 25, negative, 'url:employment', score);
  score = penalizeIfContains_(url, 'cds', 40, negative, 'url:cds', score);

  // Exclude obviously bad pages
  const hardExcludeTerms = ['directory', 'faculty', 'employment', 'job', 'news'];
  if (hardExcludeTerms.some(t => url.includes(t))) {
    keep = false;
  }

  // If the page has almost no scholarship/aid signal, do not keep
  const weakSignal =
    !url.includes('scholar') &&
    !url.includes('financial-aid') &&
    !url.includes('financial_aid') &&
    !url.includes('finaid') &&
    !title.includes('scholarship') &&
    !title.includes('financial aid');

  if (weakSignal && score < 20) {
    keep = false;
    negative.push('weak-signal');
  }

  return {
    score,
    positive,
    negative,
    keep
  };
}

/***********************
 * Helpers
 ***********************/

function makeHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    map[String(h).trim().toLowerCase()] = i;
  });
  return map;
}

function writeRowsInChunks_(sheet, rows, startRow, startCol, chunkSize) {
  const size = chunkSize || 500;

  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        sheet.getRange(startRow + i, startCol, chunk.length, chunk[0].length).setValues(chunk);
        success = true;
      } catch (err) {
        Logger.log(`Chunk write failed at row ${startRow + i}, attempt ${attempts}: ${err}`);
        Utilities.sleep(1500 * attempts);
      }
    }

    if (!success) {
      throw new Error(`Failed writing chunk starting at row ${startRow + i}`);
    }
  }
}

function val(row, idx, headerName) {
  const i = idx[String(headerName).trim().toLowerCase()];
  return i === undefined ? '' : row[i];
}

function parseIntSafe(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 999 : n;
}

function parseFloatSafe(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function blankCandidate_() {
  return {
    url: '',
    title: '',
    score: ''
  };
}

function addIfContains_(text, needle, points, bucket, label, cb) {
  if (String(text).includes(String(needle))) {
    bucket.push(label);
    cb(points);
  }
}

function penalizeIfContains_(text, needle, points, bucket, label, score) {
  if (String(text).includes(String(needle))) {
    bucket.push(label);
    return score - points;
  }
  return score;
}
