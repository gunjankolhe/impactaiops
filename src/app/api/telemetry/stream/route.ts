import { NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry/generator';

export async function GET() {
  const snapshot = telemetryService.getNextSnapshot();
  const activeScenario = telemetryService.getActiveScenario();
  const history = telemetryService.getHistory();

  return NextResponse.json({
    snapshot,
    activeScenario,
    history,
  });
}
