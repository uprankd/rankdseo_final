/**
 * Spam detection utility for support tickets
 * Analyzes ticket content and user behavior to identify potential spam
 */

interface SpamCheckResult {
  isSpam: boolean;
  spamScore: number;
  reasons: string[];
}

export function detectSpam(params: {
  subject: string;
  message: string;
  userEmail: string;
  userName: string | null;
  hasActiveSubscription: boolean;
  ticketCount?: number;
}): SpamCheckResult {
  const { subject, message, userEmail, userName, hasActiveSubscription, ticketCount = 0 } = params;
  
  let spamScore = 0;
  const reasons: string[] = [];

  // Combine text for analysis
  const fullText = `${subject} ${message}`.toLowerCase();

  // 1. Spam keywords (high weight)
  const spamKeywords = [
    'viagra', 'cialis', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'buy now', 'limited time', 'act now', 'free money',
    'make money fast', 'work from home', 'earn $', 'prize', 'claim now',
    'urgent action', 'verify account', 'suspended account', 'unusual activity',
    'click link', 'download attachment', 'nigerian prince', 'inheritance',
    'bitcoin', 'cryptocurrency investment', 'forex trading', 'binary options'
  ];
  
  const matchedKeywords = spamKeywords.filter(keyword => fullText.includes(keyword));
  if (matchedKeywords.length > 0) {
    spamScore += matchedKeywords.length * 25;
    reasons.push(`Contains spam keywords: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }

  // 2. Suspicious URLs (medium weight)
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = fullText.match(urlPattern) || [];
  if (urls.length > 3) {
    spamScore += 20;
    reasons.push(`Contains ${urls.length} URLs`);
  }

  // 3. ALL CAPS (medium weight)
  const capsRatio = (fullText.match(/[A-Z]/g) || []).length / fullText.length;
  if (capsRatio > 0.5 && fullText.length > 20) {
    spamScore += 15;
    reasons.push('Excessive use of capital letters');
  }

  // 4. Excessive special characters
  const specialChars = (fullText.match(/[!$%]/g) || []).length;
  if (specialChars > 10) {
    spamScore += 15;
    reasons.push('Excessive special characters');
  }

  // 5. Very short messages with URLs
  if (message.length < 50 && urls.length > 0) {
    spamScore += 20;
    reasons.push('Very short message with URL');
  }

  // 6. Suspicious email patterns
  const suspiciousEmailPatterns = [
    /\d{5,}@/, // Many numbers in email
    /@temp/, // Temp email services
    /@mailinator/, 
    /@guerrillamail/,
    /@10minute/
  ];
  
  if (suspiciousEmailPatterns.some(pattern => pattern.test(userEmail))) {
    spamScore += 30;
    reasons.push('Suspicious email pattern');
  }

  // 7. No name or generic name
  if (!userName || userName.toLowerCase().match(/^(user|test|admin|info|contact|support)$/)) {
    spamScore += 10;
    reasons.push('Generic or missing user name');
  }

  // 8. Repetitive content
  const words = fullText.split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
    spamScore += 15;
    reasons.push('Highly repetitive content');
  }

  // 9. POSITIVE SIGNALS (reduce spam score for real users)
  if (hasActiveSubscription) {
    spamScore = Math.max(0, spamScore - 50);
    reasons.push('✓ Has active subscription');
  }

  if (ticketCount > 0 && ticketCount < 10) {
    spamScore = Math.max(0, spamScore - 20);
    reasons.push(`✓ Has ${ticketCount} previous tickets`);
  }

  // 10. Too many tickets in short time
  if (ticketCount > 15) {
    spamScore += 25;
    reasons.push('Excessive ticket creation');
  }

  // Determine if spam (threshold: 50)
  const isSpam = spamScore >= 50;

  return {
    isSpam,
    spamScore: Math.min(100, spamScore), // Cap at 100
    reasons,
  };
}

/**
 * Get user-friendly spam classification
 */
export function getSpamLabel(spamScore: number): {
  label: string;
  color: string;
  description: string;
} {
  if (spamScore >= 75) {
    return {
      label: 'High Risk',
      color: 'bg-red-100 text-red-800 border-red-300',
      description: 'Very likely spam - auto-filtered',
    };
  } else if (spamScore >= 50) {
    return {
      label: 'Suspicious',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      description: 'Possibly spam - review needed',
    };
  } else if (spamScore >= 25) {
    return {
      label: 'Low Risk',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      description: 'Low spam indicators',
    };
  } else {
    return {
      label: 'Legitimate',
      color: 'bg-green-100 text-green-800 border-green-300',
      description: 'Likely from real user',
    };
  }
}
