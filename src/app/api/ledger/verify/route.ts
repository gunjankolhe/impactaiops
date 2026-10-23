import { NextResponse } from 'next/server';
import { cryptoLedger } from '@/lib/security/cryptoLedger';

export async function GET() {
  const ledger = cryptoLedger.getLedger();
  const integrity = cryptoLedger.verifyIntegrity();

  return NextResponse.json({
    ledger,
    integrity,
  });
}
