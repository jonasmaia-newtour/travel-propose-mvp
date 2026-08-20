import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/proposals/publish-service';
import { approvalRequestSchema } from '@/schemas/public-actions';

export const dynamic = 'force-dynamic';

interface ReceiptItem {
  section_title: string;
  item_title: string;
  price_delta: number;
}

interface ApprovalReceipt {
  id: string;
  approved_at: string;
  currency: string;
  base_amount: number;
  total: number;
  terms_version: number;
  items: ReceiptItem[];
}

function toPublicReceipt(receipt: ApprovalReceipt) {
  return {
    id: receipt.id,
    approvedAt: receipt.approved_at,
    currency: receipt.currency,
    baseAmount: receipt.base_amount,
    total: receipt.total,
    termsVersion: receipt.terms_version,
    items: receipt.items.map((item) => ({
      sectionTitle: item.section_title,
      itemTitle: item.item_title,
      priceDelta: item.price_delta,
    })),
  };
}

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

  const parsed = approvalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados do aceite inválidos.', code: 'invalid_selection' },
      { status: 422 },
    );
  }

  const client = await createClient();
  const { data, error } = await client.rpc('approve_public_proposal', {
    p_token_hash: hashToken(token),
    p_selection: parsed.data.selection,
    p_terms_version: parsed.data.termsVersion,
    p_terms_accepted: parsed.data.termsAccepted,
    p_session_id: parsed.data.sessionId,
  });

  if (error || data === null || typeof data !== 'object' || !('ok' in data)) {
    return NextResponse.json(
      { error: 'Não foi possível processar o aceite.' },
      { status: 500 },
    );
  }

  const result = data as unknown as {
    ok: boolean;
    code?: string;
    receipt?: ApprovalReceipt;
  };

  if (result.ok && result.receipt) {
    return NextResponse.json(toPublicReceipt(result.receipt), { status: 201 });
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
        { error: 'A proposta já foi aprovada ou já não aceita o aceite.', code: result.code },
        { status: 409 },
      );
    case 'terms_required':
      return NextResponse.json(
        { error: 'É necessário aceitar as condições para aprovar.', code: result.code },
        { status: 409 },
      );
    case 'terms_version_mismatch':
      return NextResponse.json(
        { error: 'As condições foram alteradas. Recarregue a proposta e confirme novamente.', code: result.code },
        { status: 409 },
      );
    case 'invalid_selection':
      return NextResponse.json(
        { error: 'A seleção de opções é inválida.', code: result.code },
        { status: 422 },
      );
    default:
      return NextResponse.json(
        { error: 'Não foi possível processar o aceite.' },
        { status: 500 },
      );
  }
}