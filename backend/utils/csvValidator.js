// backend/utils/csvValidator.js
// CSV-03: Validate that uploaded CSV matches Play Console export format

const REQUIRED_COLUMNS = [
  'Package Name',
  'Star Rating',
  'Review Text',
  'Review Submit Date and Time',
  'App Version Name'
];

// Validate raw header row (before parsing into our format)
export function validateCsvHeaders(rawHeaders) {
  const missingColumns = REQUIRED_COLUMNS.filter(col =>
    !rawHeaders.some(h => h.trim() === col)
  );

  if (missingColumns.length > 0) {
    return {
      valid: false,
      message: `This doesn't look like a Play Console CSV. Missing columns: ${missingColumns.join(', ')}. Export from Play Console → Reviews → Download CSV.`
    };
  }

  return { valid: true };
}

// Validate parsed reviews array
export function validateCsvFormat(reviews) {
  if (!reviews || reviews.length === 0) {
    return { valid: false, message: 'CSV file is empty' };
  }

  // Check for future dates (edge case from doc)
  const now = new Date();
  const futureDateReviews = reviews.filter(r =>
    r.originalCreatedAt && r.originalCreatedAt > now
  );

  if (futureDateReviews.length > 0) {
    return {
      valid: false,
      message: `CSV contains ${futureDateReviews.length} review(s) with future dates. Please re-export from Play Console.`
    };
  }

  // Check for too many invalid ratings (corrupted CSV signal)
  const invalidRatings = reviews.filter(r =>
    r.starRating < 1 || r.starRating > 5 || isNaN(r.starRating)
  );

  if (invalidRatings.length > reviews.length * 0.5) {
    return { valid: false, message: 'CSV appears corrupted — too many invalid star ratings' };
  }

  return { valid: true };
}
