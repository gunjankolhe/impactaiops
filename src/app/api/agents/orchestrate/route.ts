import { NextResponse } from 'next/server';
import { orchestrateIncidentResponse } from '@/lib/agents/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { scenarioId, userPrompt, apiKey } = body;

    const incident = await orchestrateIncidentResponse(scenarioId, userPrompt, apiKey);

    return NextResponse.json({
      success: true,
      incident,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
