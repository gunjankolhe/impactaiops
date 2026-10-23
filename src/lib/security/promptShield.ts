import type { PromptInjectionAnalysis } from '../../types';

/**
 * Prompt Injection & Adversarial Attack Defense Shield
 * Protects financial agent reasoning pipelines from malicious user or tool payloads.
 */

const INJECTION_PATTERNS = [
  {
    regex: /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|rules|prompts)/i,
    category: 'DELIMITER_OVERRIDE' as const,
    weight: 0.95,
    description: 'System instruction disregard directive',
  },
  {
    regex: /(?:system\s+override|admin\s+mode|root\s+access|sudo\s+mode|jailbreak|developer\s+mode)/i,
    category: 'PRIVILEGE_ESCALATION' as const,
    weight: 0.92,
    description: 'Privilege escalation or jailbreak trigger',
  },
  {
    regex: /(?:waive\s+(?:all\s+)?fees|credit\s+\$?[0-9,]+\s+(?:to\s+my|to\s+account)|authorize\s+(?:unlimited\s+)?refund|bypass\s+(?:kyc|aml|limits))/i,
    category: 'FINANCIAL_EXPLOIT' as const,
    weight: 0.98,
    description: 'Unauthorized financial ledger or balance manipulation',
  },
  {
    regex: /(?:print|dump|show|reveal|exfiltrate)\s+(?:api\s*key|secret|environment|database|password|credentials|private\s*key)/i,
    category: 'DATA_EXFILTRATION' as const,
    weight: 0.96,
    description: 'Secret and credential exfiltration payload',
  },
  {
    regex: /(?:<\|im_start\|>|<\|system\|>|```(?:system|admin)|---+\s*BEGIN\s+SYSTEM)/i,
    category: 'DELIMITER_OVERRIDE' as const,
    weight: 0.90,
    description: 'Role delimiter or special token smuggling',
  },
];

export function inspectPromptSecurity(input: string): PromptInjectionAnalysis {
  let highestWeight = 0;
  let dominantCategory: PromptInjectionAnalysis['riskCategory'] = 'CLEAN';
  const detected: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(input)) {
      detected.push(pattern.description);
      if (pattern.weight > highestWeight) {
        highestWeight = pattern.weight;
        dominantCategory = pattern.category;
      }
    }
  }

  const isInjection = highestWeight >= 0.75;

  let sanitized = input;
  if (isInjection) {
    // Neutralize dangerous directives
    sanitized = `[NEUTRALIZED_ADVERSARIAL_PAYLOAD: Threat Category ${dominantCategory}]`;
  }

  return {
    isInjection,
    confidenceScore: highestWeight,
    riskCategory: dominantCategory,
    detectedPatterns: detected,
    sanitizedInput: sanitized,
    rawInput: input,
    actionBlocked: isInjection,
  };
}
