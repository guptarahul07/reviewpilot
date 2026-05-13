export function sanitizeString(input, maxLen = 1000) {
    if (!input || typeof input !== 'string') return '';
  
    return input
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .substring(0, maxLen);
  }
  
  export function sanitizeSettingsInput(data) {
    return {
      ...(data.replyMode !== undefined && { replyMode: sanitizeString(data.replyMode, 20) }),
      ...(data.tone !== undefined && { tone: sanitizeString(data.tone, 20) }),
      ...(data.businessName !== undefined && { businessName: sanitizeString(data.businessName, 100) }),
      ...(data.customInstructions !== undefined && { customInstructions: sanitizeString(data.customInstructions, 500) }),
      ...(data.replyToRatingOnly !== undefined && { replyToRatingOnly: Boolean(data.replyToRatingOnly) })
    };
  }
  
  export function sanitizeReplyInput(replyText) {
    if (!replyText || typeof replyText !== 'string') return '';
    return sanitizeString(replyText, 4096);
  }