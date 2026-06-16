// backend/utils/csvParser.js
// CSV-02: Parse Play Console review export CSV

import Papa from 'papaparse';
import crypto from 'crypto';

export async function parsePlayConsoleCsv(buffer) {
  // Handle non-UTF-8 encoding (e.g. BOM from Excel exports)
  let csvString = buffer.toString('utf-8');
  // Strip BOM if present
  if (csvString.charCodeAt(0) === 0xFEFF) {
    csvString = csvString.slice(1);
  }

  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  return result.data.map(row => ({
    packageName: row['Package Name']?.trim(),
    appVersion: row['App Version Name']?.trim(),
    appVersionCode: row['App Version Code']?.trim(),
    reviewerLanguage: row['Reviewer Language']?.trim(),
    device: row['Device']?.trim(),
    originalCreatedAt: parseDate(row['Review Submit Date and Time']),
    lastModified: parseDate(row['Review Last Update Date and Time']),
    starRating: parseInt(row['Star Rating']) || 0,
    reviewTitle: row['Review Title']?.trim() || null,
    text: row['Review Text']?.trim() || '',
    replyText: row['Developer Reply Text']?.trim() || null,
    replyPostedAt: row['Developer Reply Date and Time']
      ? parseDate(row['Developer Reply Date and Time'])
      : null,
    reviewUrl: row['Review Link']?.trim() || null,
    reviewId: extractReviewId(row['Review Link']) || generateStableId(row),
    source: 'csv_import',
    platform: 'google_play'
  }));
}

function extractReviewId(reviewUrl) {
  if (!reviewUrl) return null;
  const match = reviewUrl.match(/reviewId=([^&]+)/);
  return match ? match[1] : null;
}

function generateStableId(row) {
  const str = `${row['Package Name']}_${row['Review Submit Millis Since Epoch']}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}
