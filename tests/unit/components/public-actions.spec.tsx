/**
 * Testes das ações públicas (T046): expiração durante a navegação,
 * aceitação dos termos, aprovação com recibo, pedido de ajuste e erros.
 * O fetch global é mockado; jsdom não implementa showModal/close — stubs.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PublicActions } from '@/components/proposal/public-actions';
import type { PublicProposal } from '@/schemas/public-proposal';
import type { PublicSelection } from '@/domain/proposal/public-pricing';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

const TOKEN = 'token-publico-de-teste';

function proposalFixture(overrides: Partial<PublicProposal> = {}): PublicProposal {
  return {
    title: 'Viagem de teste',
    baseAmount: 100000,
    agency: { name: 'Agência Demo', logoUrl: null },
    currency: 'EUR',
    terms: 'Condições gerais da proposta.',
    termsVersion: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    sections: [
      {
        title: 'Alojamento',
        mode: 'single',
        items: [{ title: 'Hotel A', description: null, imageUrl: null, priceDelta: 0 }],
      },
    ],
    ...overrides,
  };
}

const SELECTION: PublicSelection = [[0]];

function mockFetch(status: number, payload: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
    )
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PublicActions', () => {
  it('mostra aviso de expiração quando o prazo já passou', () => {
    render(
      <PublicActions
        proposal={proposalFixture({ expiresAt: '2020-01-01T00:00:00.000Z' })}
        selection={SELECTION}
        token={TOKEN}
      />
    );
    expect(screen.getByText(/proposta expirou/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument();
  });

  it('mostra aviso de expiração quando o prazo termina durante a navegação', () => {
    vi.useFakeTimers();
    const expiresInTenMinutes = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    render(
      <PublicActions
        proposal={proposalFixture({ expiresAt: expiresInTenMinutes })}
        selection={SELECTION}
        token={TOKEN}
      />
    );
    expect(screen.queryByText(/proposta expirou/i)).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });
    expect(screen.getByText(/proposta expirou/i)).toBeInTheDocument();
  });

  it('exige aceitar os termos antes de aprovar', () => {
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    expect(screen.getByRole('button', { name: 'Aprovar proposta' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /aceito as condições/i }));
    expect(screen.getByRole('button', { name: 'Aprovar proposta' })).toBeEnabled();
  });

  it('envia a seleção, a versão dos termos e a sessão e mostra o recibo', async () => {
    mockFetch(201, {
      id: '8536c0f2-4472-404e-8928-389be6956e98',
      approvedAt: '2026-08-20T14:45:42.394392Z',
      currency: 'EUR',
      baseAmount: 100000,
      total: 100000,
      termsVersion: 1,
      items: [{ sectionTitle: 'Alojamento', itemTitle: 'Hotel A', priceDelta: 0 }],
    });
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /aceito as condições/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar proposta' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/v1/public/proposals/${TOKEN}/approval`,
        expect.objectContaining({ method: 'POST' })
      );
    });
    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(call[1]?.body ?? '')) as {
      selection: PublicSelection;
      termsVersion: number;
      termsAccepted: boolean;
      sessionId: string;
    };
    expect(body.selection).toEqual(SELECTION);
    expect(body.termsVersion).toBe(1);
    expect(body.termsAccepted).toBe(true);
    expect(body.sessionId.length).toBeGreaterThanOrEqual(8);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Proposta aprovada' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('receipt-total')).toHaveTextContent(/1\s*000,00\s*€/);
  });

  it('mostra aviso de expiração quando o servidor devolve 409 expired', async () => {
    mockFetch(409, { error: 'A proposta expirou.', code: 'expired' });
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /aceito as condições/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar proposta' }));

    await waitFor(() => {
      expect(screen.getByText(/proposta expirou/i)).toBeInTheDocument();
    });
  });

  it('mostra erro quando os termos foram alterados no servidor', async () => {
    mockFetch(409, {
      error: 'As condições foram alteradas. Recarregue a proposta e confirme novamente.',
      code: 'terms_version_mismatch',
    });
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /aceito as condições/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar proposta' }));

    await waitFor(() => {
      expect(screen.getByText(/condições foram alteradas/i)).toBeInTheDocument();
    });
  });

  it('mostra erro genérico quando a ligação falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede indisponível')));
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /aceito as condições/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar proposta' }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível aprovar/i)).toBeInTheDocument();
    });
  });

  it('abre o diálogo de pedido de ajuste', () => {
    render(<PublicActions proposal={proposalFixture()} selection={SELECTION} token={TOKEN} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pedir ajuste' }));
    expect(screen.getByRole('heading', { name: 'Pedir ajuste' })).toBeInTheDocument();
    expect(screen.getByLabelText('Observação')).toBeInTheDocument();
  });
});