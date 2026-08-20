import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/proposals/publish-service';
import { adjustmentRequestSchema } from '@/schemas/public-actions';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido.' }, { status: 400 });
  }

  const parsed = adjustmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Mensagem inválida.', code: 'invalid_message' },
      { status: 422 },
    );
  }

  const client = await createClient();
  const { data, error } = await client.rpc('request_public_adjustment', {
    p_token_hash: hashToken(token),
    p_message: parsed.data.message,
    p_session_id: parsed.data.sessionId,
  });

  if (error || data === null || typeof data !== 'object' || !('ok' in data)) {
    return NextResponse.json(
      { error: 'Não foi possível processar o pedido.' },
      { status: 500 },
    );
  }

  const result = data as unknown as { ok: boolean; code?: string };

  if (result.ok) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  switch (result.code) {
    case 'not_found':
      return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
    case 'expired':
      return NextResponse.json(
        { error: 'A proposta expirou.', code: result.code },
        { status: 409 },
      );
    case 'invalid_state':
      return NextResponse.json(
        { error: 'A proposta já não aceita pedidos de ajuste.', code: result.code },
        { status: 409 },
      );
    case 'invalid_message':
      return NextResponse.json(
        { error: 'Mensagem inválida.', code: result.code },
        { status: 422 },
      );
    default:
      return NextResponse.json(
        { error: 'Não foi possível processar o pedido.' },
        { status: 500 },
      );
  }
}