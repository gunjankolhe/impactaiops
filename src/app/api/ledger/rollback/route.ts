import { NextResponse } from 'next/server';
import { cryptoLedger } from '@/lib/security/cryptoLedger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { index } = body;

    if (typeof index !== 'number') {
      return NextResponse.json({ error: 'index must be a number' }, { status: 400 });
    }

    const result = cryptoLedger.rollbackAction(index);
    const updatedLedger = cryptoLedger.getLedger();

    return NextResponse.json({
      ...result,
      ledger: updatedLedger,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
