import { NextResponse } from 'next/server';
import { redactSensitiveData } from '@/lib/security/piiRedactor';
import { inspectPromptSecurity } from '@/lib/security/promptShield';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt string is required' }, { status: 400 });
    }

    const redaction = redactSensitiveData(prompt);
    const security = inspectPromptSecurity(redaction.sanitized);

    return NextResponse.json({
      success: true,
      rawInput: prompt,
      redaction,
      security,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
