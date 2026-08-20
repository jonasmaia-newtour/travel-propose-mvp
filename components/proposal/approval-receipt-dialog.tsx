'use client';

import { Dialog } from '@/components/proposal/dialog';
import { formatCurrency, formatDateTime } from '@/lib/i18n/format';

/**
 * Recibo público do aceite (T046): mostra os valores congelados no snapshot
 * devolvido pelo POST /approval. A fonte de verdade é o servidor; o cliente
 * apenas apresenta a confirmação.
 */
export interface PublicReceiptItem {
  sectionTitle: string;
  itemTitle: string;
  priceDelta: number;
}

export interface PublicReceipt {
  id: string;
  approvedAt: string;
  currency: string;
  baseAmount: number;
  total: number;
  termsVersion: number;
  items: PublicReceiptItem[];
}

interface ApprovalReceiptDialogProps {
  open: boolean;
  receipt: PublicReceipt | null;
  onClose: () => void;
}

export function ApprovalReceiptDialog({ open, receipt, onClose }: ApprovalReceiptDialogProps) {
  if (receipt === null) {
    return null;
  }

  const baseAmount = formatCurrency(receipt.baseAmount);
  const total = formatCurrency(receipt.total);

  return (
    <Dialog open={open} title="Proposta aprovada" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Aceite registado a {formatDateTime(receipt.approvedAt)}. A agência vai confirmar a
          proposta com os valores abaixo.
        </p>

        <ul className="space-y-2">
          {receipt.items.map((item, index) => (
            <li
              key={`${item.sectionTitle}-${item.itemTitle}-${index}`}
              className="flex items-start justify-between gap-3 rounded-md border border-foreground/10 p-3 text-sm"
            >
              <span>
                <span className="block font-medium">{item.itemTitle}</span>
                <span className="text-muted-foreground">{item.sectionTitle}</span>
              </span>
              <span className="shrink-0">{formatCurrency(item.priceDelta)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1 border-t border-foreground/10 pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Valor base</dt>
            <dd>{baseAmount}</dd>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <dt>Total</dt>
            <dd data-testid="receipt-total">{total}</dd>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <dt>Versão das condições</dt>
            <dd>{receipt.termsVersion}</dd>
          </div>
        </dl>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Fechar
          </button>
        </div>
      </div>
    </Dialog>
  );
}