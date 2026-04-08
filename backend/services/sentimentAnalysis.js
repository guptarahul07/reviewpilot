// backend/services/sentimentAnalysis.js
//
// Detects mixed sentiment in reviews (e.g., sarcastic 5-star reviews)
// Flags reviews that need manual approval before auto-posting

/**
 * Negative phrases that suggest dissatisfaction
 * These indicate complaints even in high-rated reviews
 */
const NEGATIVE_PHRASES = [
    'but', 'however', 'unfortunately', 'disappointed',
    'terrible', 'awful', 'worst', 'horrible', 'disgusting',
    'never again', 'won\'t return', 'not recommended', 'avoid',
    'overpriced', 'waste of', 'don\'t bother', 'skip',
    'rude', 'unprofessional', 'slow', 'cold food',
    'long wait', 'waited forever', 'took forever',
    'dirty', 'filthy', 'unhygienic', 'unsanitary',
    'stale', 'burnt', 'raw', 'undercooked', 'overcooked',
    'cockroach', 'flies', 'hair in', 'smelled bad'
  ];
  
  /**
   * Complaint indicators - words that signal problems
   */
  const COMPLAINT_INDICATORS = [
    'waited', 'wait', 'late', 'slow', 'forgot', 'wrong',
    'missing', 'broken', 'smelled', 'stale',
    'burnt', 'undercooked', 'overcooked', 'cold',
    'expired', 'complained', 'issue', 'disappointing',
    'problem', 'disappointed', 'refund', 'money back',
    'manager', 'complaint', 'unacceptable', 'ridiculous'
  ];
  
  /**
   * Sarcastic patterns - common sarcasm structures
   */
  const SARCASM_PATTERNS = [
    /great.*but.*terrible/i,
    /good.*however.*bad/i,
    /nice.*but.*worst/i,
    /loved.*but.*disappointed/i,
    /excellent.*but.*horrible/i,
    /\d+\s*star.*but/i,  // "5 star but..."
    /if you (like|enjoy|want).*then/i,  // "If you like bad service, then..."
    /yeah right/i,
    /sure.*not/i,
    /totally.*not/i
  ];
  
  /**
   * Check if a review has mixed sentiment
   * Returns true if the review should require manual approval
   * 
   * @param {string} reviewText - The review text to analyze
   * @param {number} rating - Star rating (1-5)
   * @returns {boolean} True if mixed sentiment detected
   */
  export function hasMixedSentiment(reviewText, rating) {
    // Always flag low ratings (1-3 stars)
    if (rating <= 3) {
      return true;
    }
    
    // For 4-5 star reviews, check for negative content
    if (!reviewText || reviewText.trim().length === 0) {
      return false; // No text = can't be mixed
    }
    
    const text = reviewText.toLowerCase();
    
    // Count negative phrases
    const negativeCount = NEGATIVE_PHRASES.filter(phrase => 
      text.includes(phrase.toLowerCase())
    ).length;
    
    // Count complaint indicators
    const complaintCount = COMPLAINT_INDICATORS.filter(word => 
      text.includes(word.toLowerCase())
    ).length;
    
    // Flag if multiple negative indicators found
    if (negativeCount >= 2 || complaintCount >= 2) {
      return true;
    }
    
    // Check for sarcastic patterns
    const hasSarcasm = SARCASM_PATTERNS.some(pattern => pattern.test(reviewText));
    
    if (hasSarcasm) {
      return true;
    }
    
    // Check for contradiction (positive word + negative word close together)
    const contradictionPatterns = [
      /good.*but.*bad/i,
      /great.*but.*(terrible|awful|worst)/i,
      /excellent.*but.*(horrible|disgusting)/i,
      /love.*but.*(hate|disappointed)/i,
      /best.*but.*worst/i
    ];
    
    const hasContradiction = contradictionPatterns.some(pattern => 
      pattern.test(reviewText)
    );
    
    return hasContradiction;
  }
  
  /**
   * Get sentiment label for display
   * @param {string} reviewText - Review text
   * @param {number} rating - Star rating (1-5)
   * @returns {string} Sentiment label: 'positive', 'neutral', 'negative', 'mixed'
   */
  export function getSentimentLabel(reviewText, rating) {
    if (rating <= 2) return 'negative';
    if (rating === 3) return 'neutral';
    if (hasMixedSentiment(reviewText, rating)) return 'mixed';
    return 'positive';
  }
  
  /**
   * Analyze review and return detailed sentiment info
   * @param {string} reviewText - Review text
   * @param {number} rating - Star rating (1-5)
   * @returns {Object} Sentiment analysis result
   */
  export function analyzeSentiment(reviewText, rating) {
    const text = reviewText.toLowerCase();
    
    // Find which negative phrases are present
    const foundNegatives = NEGATIVE_PHRASES.filter(phrase => 
      text.includes(phrase.toLowerCase())
    );
    
    // Find which complaint indicators are present
    const foundComplaints = COMPLAINT_INDICATORS.filter(word => 
      text.includes(word.toLowerCase())
    );
    
    // Check for sarcasm
    const sarcasmMatches = SARCASM_PATTERNS.filter(pattern => 
      pattern.test(reviewText)
    );
    
    const isMixed = hasMixedSentiment(reviewText, rating);
    const label = getSentimentLabel(reviewText, rating);
    
    return {
      label,
      isMixed,
      shouldFlag: isMixed,
      indicators: {
        negativeCount: foundNegatives.length,
        complaintCount: foundComplaints.length,
        hasSarcasm: sarcasmMatches.length > 0,
        foundNegatives: foundNegatives.slice(0, 3), // Top 3
        foundComplaints: foundComplaints.slice(0, 3)  // Top 3
      },
      recommendation: isMixed 
        ? 'Manual review recommended - mixed sentiment detected'
        : 'Safe for auto-reply'
    };
  }
  
  /**
   * Test examples (for development/debugging)
   */
  export function testSentimentDetection() {
    const testCases = [
      { text: "Great food but terrible service!", rating: 5 },
      { text: "Absolutely loved it! Best restaurant ever.", rating: 5 },
      { text: "Good food however the wait was awful", rating: 4 },
      { text: "If you like cold food and rude staff, this is perfect!", rating: 5 },
      { text: "Okay experience, nothing special", rating: 3 },
      { text: "Horrible. Never coming back.", rating: 1 }
    ];
    
    console.log('🧪 Testing Sentiment Detection:\n');
    
    testCases.forEach(({ text, rating }) => {
      const analysis = analyzeSentiment(text, rating);
      console.log(`Rating: ${rating}⭐ | Text: "${text}"`);
      console.log(`Label: ${analysis.label} | Mixed: ${analysis.isMixed}`);
      console.log(`Recommendation: ${analysis.recommendation}\n`);
    });
  }