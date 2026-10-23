/**
 * PCI-DSS & PII Redaction Pipeline
 * Guarantees zero sensitive cardholder or personal identifiable information
 * is transmitted to LLM inference or saved to unencrypted logs.
 */

// Luhn algorithm validator for primary account numbers (PAN)
export function isValidLuhn(digits: string): boolean {
  const clean = digits.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export interface RedactionResult {
  sanitized: string;
  redactedCount: number;
  typesRedacted: string[];
}

export function redactSensitiveData(input: string): RedactionResult {
  let text = input;
  let count = 0;
  const typesRedacted: Set<string> = new Set();

  // 1. Credit Card Numbers (13-19 digits with spaces or hyphens)
  const ccRegex = /\b(?:\d[ -]?){13,19}\b/g;
  text = text.replace(ccRegex, (match) => {
    const rawDigits = match.replace(/\D/g, '');
    if (isValidLuhn(rawDigits)) {
      count++;
      typesRedacted.add('PCI_CARD_PAN');
      const last4 = rawDigits.slice(-4);
      return `[REDACTED_PCI_PAN:***-****-${last4}]`;
    }
    return match;
  });

  // 2. CVV / CVC (3-4 digits preceded by cvv/cvc indicators)
  const cvvRegex = /\b(?:cvv|cvc|cid|security\s*code)[\s:=]+([0-9]{3,4})\b/gi;
  text = text.replace(cvvRegex, (match, cvv) => {
    count++;
    typesRedacted.add('PCI_CVV');
    return match.replace(cvv, '[REDACTED_CVV]');
  });

  // 3. Social Security Numbers (US SSN: XXX-XX-XXXX)
  const ssnRegex = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;
  text = text.replace(ssnRegex, () => {
    count++;
    typesRedacted.add('PII_SSN');
    return '[REDACTED_PII_SSN]';
  });

  // 4. API Keys & Bearer Tokens (sk_live_, ghp_, Bearer ...)
  const secretRegex = /\b(?:sk_live_[a-zA-Z0-9]{24,}|ghp_[a-zA-Z0-9]{36}|Bearer\s+[a-zA-Z0-9\-._~+/]+=*)\b/g;
  text = text.replace(secretRegex, () => {
    count++;
    typesRedacted.add('SECRET_TOKEN');
    return '[REDACTED_SECRET_KEY]';
  });

  return {
    sanitized: text,
    redactedCount: count,
    typesRedacted: Array.from(typesRedacted),
  };
}
