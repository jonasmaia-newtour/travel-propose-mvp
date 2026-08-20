/**
 * Testes do diálogo de pedido de ajuste (T046): validação da mensagem,
 * envio para POST /adjustments, estados de carregamento, sucesso e erro.
 * O fetch global é mockado; jsdom não implementa showModal/close — stubs.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdjustmentDialog } from '@/components/proposal/adjustment-dialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

const TOKEN = 'token-publico-de-teste';

function renderDialog(overrides: { onSubmitted?: () => void; onClose?: () => void } = {}) {
  const onSubmitted = overrides.onSubmitted ?? vi.fn();
  const onClose = overrides.onClose ?? vi.fn();
  render(
    <AdjustmentDialog open token={TOKEN} onClose={onClose} onSubmitted={onSubmitted} />
  );
  return { onSubmitted, onClose };
}

async function typeMessage(message: string) {
  const textarea = screen.getByLabelText('Observação');
  fireEvent.change(textarea, { target: { value: message } });
}

async function submitForm() {
  const form = document.querySelector('form') as HTMLFormElement;
  fireEvent.submit(form);
}

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
});

describe('AdjustmentDialog', () => {
  it('apresenta o formulário com contador de caracteres', () => {
    renderDialog();
    expect(screen.getByLabelText('Observação')).toBeInTheDocument();
    expect(screen.getByText(/0\s*\/\s*2000/)).toBeInTheDocument();
  });

  it('não envia com mensagem vazia e mostra erro', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { onSubmitted } = renderDialog();
    await submitForm();
    await waitFor(() => {
      expect(screen.getByText(/entre 1 e 2000 caracteres/)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('envia a mensagem e a sessão para POST /adjustments', async () => {
    mockFetch(202, { ok: true });
    renderDialog();
    await typeMessage('Gostaria de trocar o hotel.');
    await submitForm();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/v1/public/proposals/${TOKEN}/adjustments`,
        expect.objectContaining({ method: 'POST' })
      );
    });
    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(call[1]?.body ?? '')) as {
      message: string;
      sessionId: string;
    };
    expect(body.message).toBe('Gostaria de trocar o hotel.');
    expect(body.sessionId.length).toBeGreaterThanOrEqual(8);
  });

  it('mostra confirmação após o envio com sucesso', async () => {
    mockFetch(202, { ok: true });
    const { onSubmitted } = renderDialog();
    await typeMessage('Mensagem válida');
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/pedido enviado/i)).toBeInTheDocument();
    });
    expect(onSubmitted).toHaveBeenCalledOnce();
  });

  it('mostra o erro devolvido pelo servidor', async () => {
    mockFetch(422, { error: 'Mensagem inválida.', code: 'invalid_message' });
    renderDialog();
    await typeMessage('Mensagem válida');
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText('Mensagem inválida.')).toBeInTheDocument();
    });
  });

  it('mostra aviso de expiração quando o servidor devolve 409 expired', async () => {
    mockFetch(409, { error: 'A proposta expirou.', code: 'expired' });
    renderDialog();
    await typeMessage('Mensagem válida');
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/expirou/)).toBeInTheDocument();
    });
  });

  it('mostra erro genérico quando a ligação falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede indisponível')));
    renderDialog();
    await typeMessage('Mensagem válida');
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/não foi possível enviar/i)).toBeInTheDocument();
    });
  });

  it('repõe o estado ao reabrir (montagem condicional)', async () => {
    mockFetch(202, { ok: true });
    const { unmount } = render(
      <AdjustmentDialog open token={TOKEN} onClose={() => {}} onSubmitted={() => {}} />
    );
    await typeMessage('Primeira mensagem');
    await submitForm();
    await waitFor(() => {
      expect(screen.getByText(/pedido enviado/i)).toBeInTheDocument();
    });

    unmount();
    render(
      <AdjustmentDialog open token={TOKEN} onClose={() => {}} onSubmitted={() => {}} />
    );

    expect(screen.getByLabelText('Observação')).toHaveValue('');
    expect(screen.queryByText(/pedido enviado/i)).not.toBeInTheDocument();
  });
});