/**
 * Testes do diálogo de recibo de aceite (T046): apresenta o recibo público
 * devolvido pelo POST /approval (itens, totais e versão dos termos).
 * O jsdom não implementa showModal/close — stubs que refletem open.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  ApprovalReceiptDialog,
  type PublicReceipt,
} from '@/components/proposal/approval-receipt-dialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

const receipt: PublicReceipt = {
  id: '8536c0f2-4472-404e-8928-389be6956e98',
  approvedAt: '2026-08-20T14:45:42.394392Z',
  currency: 'EUR',
  baseAmount: 100000,
  total: 110000,
  termsVersion: 1,
  items: [
    { sectionTitle: 'Alojamento', itemTitle: 'Premium', priceDelta: 5000 },
    { sectionTitle: 'Extras', itemTitle: 'Voo', priceDelta: 5000 },
  ],
};

afterEach(cleanup);

describe('ApprovalReceiptDialog', () => {
  it('não renderiza nada sem recibo', () => {
    const { container } = render(
      <ApprovalReceiptDialog open receipt={null} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('apresenta o título e a data/hora do aceite', () => {
    render(<ApprovalReceiptDialog open receipt={receipt} onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Proposta aprovada' })).toBeInTheDocument();
    const expected = new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(receipt.approvedAt));
    expect(screen.getByText(new RegExp(expected.replace(/[/:]/g, '\\$&')))).toBeInTheDocument();
  });

  it('apresenta os itens selecionados e os seus valores', () => {
    render(<ApprovalReceiptDialog open receipt={receipt} onClose={() => {}} />);
    expect(screen.getByText('Alojamento')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Extras')).toBeInTheDocument();
    expect(screen.getByText('Voo')).toBeInTheDocument();
  });

  it('apresenta os totais e a versão das condições', () => {
    render(<ApprovalReceiptDialog open receipt={receipt} onClose={() => {}} />);
    expect(screen.getByText(/1\s*100,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/1\s*000,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/condições/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});