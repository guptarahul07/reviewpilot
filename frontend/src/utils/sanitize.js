// src/utils/sanitize.js
// Frontend input sanitization — prevents XSS before rendering or submitting

/**
 * Strip all HTML tags and dangerous characters from a string.
 * Safe for display in JSX text nodes.
 */
export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Strip HTML tags entirely — returns plain text.
 * Use when you want the raw string without any HTML encoding.
 */
export function stripHtml(input) {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitize settings form before saving.
 * Validates allowed values for enum fields.
 */
export function sanitizeSettings(data) {
  const VALID_MODES  = ['manual', 'semi-auto', 'auto']
  const VALID_TONES  = ['professional', 'friendly', 'apologetic']

  return {
    businessName:      stripHtml(data.businessName      || '').slice(0, 200),
    tone:              VALID_TONES.includes(data.tone)  ? data.tone  : 'friendly',
    replyMode:         VALID_MODES.includes(data.replyMode) ? data.replyMode : 'semi-auto',
    replyToRatingOnly: Boolean(data.replyToRatingOnly),
    customInstructions: stripHtml(data.customInstructions || '').slice(0, 500),
    previewMode:       Boolean(data.previewMode),
    paused:            Boolean(data.paused),
  }
}

/**
 * Sanitize a reply text before posting.
 * Removes HTML but preserves line breaks.
 */
export function sanitizeReply(text) {
  if (!text || typeof text !== 'string') return ''
  return stripHtml(text).slice(0, 4096)
}

/**
 * Sanitize review text for display.
 * Strips HTML, preserves emoji and unicode.
 */
export function sanitizeReviewText(text) {
  if (!text || typeof text !== 'string') return ''
  return stripHtml(text).slice(0, 2000)
}
