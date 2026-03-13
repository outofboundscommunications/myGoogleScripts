function joinSchoolsWithSerp() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const shSchools = ss.getSheetByName('SCHOOLS_raw');
  const shSerp = ss.getSheetByName('APIFY_SERP_raw');
  const shOut = ss.getSheetByName('SCHOOLS_master');

  if (!shSchools || !shSerp || !shOut) throw new Error('Missing one of: SCHOOLS_raw, APIFY_SERP_raw, SCHOOLS_master');

  // --- Read data
  const schoolsValues = shSchools.getDataRange().getValues();
  const serpValues = shSerp.getDataRange().getValues();

  const schoolsHeaders = schoolsValues.shift();
  const serpHeaders = serpValues.shift();

  // --- Column helpers by header name (safer than hardcoding letters)
  const col = (headers, name) => {
    const idx = headers.indexOf(name);
    if (idx === -1) throw new Error(`Missing column "${name}"`);
    return idx;
  };

  // REQUIRED school columns
  const iSchoolName = col(schoolsHeaders, 'School Name');
  const iBaseName  = col(schoolsHeaders, 'Military Base Name');
  const iType      = col(schoolsHeaders, 'School Type');
  const iPublicPriv= col(schoolsHeaders, 'Public/Private');
  const iAddress   = col(schoolsHeaders, 'Address');
  const iCity      = col(schoolsHeaders, 'City');
  const iState     = col(schoolsHeaders, 'State');
  const iZip       = col(schoolsHeaders, 'Zip');
  const iWebsite   = col(schoolsHeaders, 'Website');
  const iPhone     = col(schoolsHeaders, 'Phone');
  const iNotes     = col(schoolsHeaders, 'Notes');
  const iDomain    = col(schoolsHeaders, 'School_Domain');

  // REQUIRED SERP columns
  const iResultDomain = col(serpHeaders, 'Result_Domain');
  const iTitle        = col(serpHeaders, 'title');         // adjust if your header is different
  const iDesc         = col(serpHeaders, 'description');   // adjust if your header is different
  const iUrl          = col(serpHeaders, 'url');           // adjust if your header is different

  // --- Build index: domain -> best URLs
  const serpIndex = new Map();

  function normDomain(d) {
    if (!d) return '';
    d = String(d).toLowerCase().trim();
    d = d.replace(/^https?:\/\//,'').replace(/^www\./,'');
    d = d.split('/')[0];
    return d;
  }

  function scoreRow(title, desc, url) {
    const t = (String(title || '') + ' ' + String(desc || '')).toLowerCase();
    let score = 0;

    // Highest intent signals
    if (t.match(/external|outside/)) score += 100;
    if (t.match(/scholarship/)) score += 60;
    if (t.match(/financial aid|financial-aid|financialaid|\bfafsa\b/)) score += 40;

    // Prefer pages likely to be real program pages
    if (String(url||'').toLowerCase().match(/scholar|aid|financial/)) score += 10;

    // Slight penalty for obvious junk
    if (String(url||'').toLowerCase().match(/pdf$/)) score -= 5;

    return score;
  }

  // For each domain we store top candidates for: external, scholarship, finaid
  function ensureBucket(domain) {
    if (!serpIndex.has(domain)) {
      serpIndex.set(domain, {
        external: { url: '', score: -9999 },
        scholarship: { url: '', score: -9999 },
        finaid: { url: '', score: -9999 }
      });
    }
    return serpIndex.get(domain);
  }

  serpValues.forEach(r => {
    const d = normDomain(r[iResultDomain]);
    if (!d) return;

    const url = r[iUrl];
    if (!url) return;

    const title = r[iTitle];
    const desc = r[iDesc];
    const txt = (String(title || '') + ' ' + String(desc || '')).toLowerCase();

    const s = scoreRow(title, desc, url);
    const bucket = ensureBucket(d);

    if (txt.match(/external|outside/)) {
      if (s > bucket.external.score) bucket.external = { url, score: s };
    }
    if (txt.match(/scholarship/)) {
      if (s > bucket.scholarship.score) bucket.scholarship = { url, score: s };
    }
    if (txt.match(/financial aid|financial-aid|financialaid|\bfafsa\b|\baid\b/)) {
      if (s > bucket.finaid.score) bucket.finaid = { url, score: s };
    }
  });

  // --- Output mapping (match your SCHOOLS_master columns)
  // Here we write a clean table: base, school, type, etc + 3 URL columns
  const outHeaders = shOut.getRange(1, 1, 1, shOut.getLastColumn()).getValues()[0];

  // Find where to put the 3 URL fields in SCHOOLS_master by header name
  // Change these to match your master headers exactly:
  const outExternalName = 'External_Scholarships_URL';
  const outScholarName  = 'Scholarships_URL';
  const outFinAidName   = 'Financial_Aid_URL';

  const outIdx = (name) => {
    const idx = outHeaders.indexOf(name);
    if (idx === -1) throw new Error(`Missing "${name}" in SCHOOLS_master headers`);
    return idx;
  };

  const oBase   = outHeaders.indexOf('Military Base Name');
  const oSchool = outHeaders.indexOf('School Name');
  const oType   = outHeaders.indexOf('School Type');
  const oPub    = outHeaders.indexOf('Public/Private');
  const oWeb    = outHeaders.indexOf('Website');
  const oNotes  = outHeaders.indexOf('Notes');

  if (oBase === -1 || oSchool === -1) throw new Error('SCHOOLS_master must include "Military Base Name" and "School Name" headers');

  const oExt  = outIdx(outExternalName);
  const oSch  = outIdx(outScholarName);
  const oAid  = outIdx(outFinAidName);

  const out = [];
  schoolsValues.forEach(r => {
    const school = r[iSchoolName];
    if (!school) return;

    const d = normDomain(r[iDomain]);
    const hit = d ? serpIndex.get(d) : null;

    const row = new Array(outHeaders.length).fill('');

    row[oBase] = r[iBaseName];
    row[oSchool] = school;
    if (oType !== -1) row[oType] = r[iType];
    if (oPub !== -1) row[oPub] = r[iPublicPriv];
    if (oWeb !== -1) row[oWeb] = r[iWebsite];
    if (oNotes !== -1) row[oNotes] = r[iNotes];

    row[oExt] = hit?.external?.url || '';
    row[oSch] = hit?.scholarship?.url || '';
    row[oAid] = hit?.finaid?.url || '';

    out.push(row);
  });

  // Clear old output values (rows below header)
  if (shOut.getLastRow() > 1) {
    shOut.getRange(2, 1, shOut.getLastRow() - 1, shOut.getLastColumn()).clearContent();
  }

  if (out.length) {
    shOut.getRange(2, 1, out.length, outHeaders.length).setValues(out);
  }
}
