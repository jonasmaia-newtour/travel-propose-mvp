import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/proposals/publish-service';
import { telemetryEventSchema } from '@/schemas/telemetry';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry === undefined || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) {
    return true;
  }
  entry.count += 1;
  return false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido.' }, { status: 400 });
  }

  const parsed = telemetryEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Evento inválido.', code: 'invalid_event' },
      { status: 422 }
    );
  }

  const rateKey = `${token}:${parsed.data.sessionId}`;
  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      { error: 'Demasiados pedidos. Tente novamente mais tarde.', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const client = await createClient();
  const { data, error } = await client.rpc('record_proposal_event', {
    p_token_hash: hashToken(token),
    p_type: parsed.data.type,
    p_session_id: parsed.data.sessionId,
    p_payload: parsed.data.payload ?? null,
    p_device: parsed.data.device ?? null,
    p_country: parsed.data.country ?? null,
  });

  if (error || data === null || typeof data !== 'object' || !('ok' in data)) {
    return NextResponse.json(
      { error: 'Não foi possível registar o evento.' },
      { status: 500 }
    );
  }

  const result = data as unknown as { ok: boolean; code?: string };

  if (result.ok) {
    return new NextResponse(null, { status: 204 });
  }

  switch (result.code) {
    case 'not_found':
      return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
    case 'expired':
      return NextResponse.json(
        { error: 'A proposta expirou.', code: result.code },
        { status: 409 }
      );
    case 'invalid_state':
      return NextResponse.json(
        { error: 'A proposta já não aceita eventos.', code: result.code },
        { status: 409 }
      );
    case 'invalid_type':
    case 'invalid_session':
      return NextResponse.json(
        { error: 'Evento inválido.', code: result.code },
        { status: 422 }
      );
    default:
      return NextResponse.json(
        { error: 'Não foi possível registar o evento.' },
        { status: 500 }
      );
  }
}
