import { NextResponse } from 'next/server';
import { optimizeBigQuerySQL } from '@/lib/bigquery/optimizer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query string is required' }, { status: 400 });
    }

    const result = optimizeBigQuerySQL(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
