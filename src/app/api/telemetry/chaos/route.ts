import { NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry/generator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenarioId } = body;

    if (!scenarioId) {
      return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 });
    }

    const scenario = telemetryService.triggerChaos(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 404 });
    }

    const currentSnapshot = telemetryService.getNextSnapshot();

    return NextResponse.json({
      success: true,
      message: `FinTech Chaos Injected: ${scenario.title}`,
      scenario,
      snapshot: currentSnapshot,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
