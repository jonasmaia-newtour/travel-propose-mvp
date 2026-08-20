'use client';

import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/proposal/dialog';
import { getPublicSessionId } from '@/lib/proposals/public-session';

/**
 * Diálogo de pedido de ajuste (T046): o viajante envia uma observação
 * (1–2000 caracteres) que devolve a proposta ao Agent para revisão.
 * Envia para POST /adjustments com a sessão anónima; mostra os estados de
 * carregamento, sucesso e erro com mensagens em PT-PT.
 * O pai monta o diálogo condicionalmente — cada abertura é um estado fresco.
 */
interface AdjustmentDialogProps {
  open: boolean;
  token: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const MAX_MESSAGE_LENGTH = 2000;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function AdjustmentDialog({ open, token, onClose, onSubmitted }: AdjustmentDialogProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Escreva uma observação entre 1 e ${MAX_MESSAGE_LENGTH} caracteres.`);
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);
    try {
      const response = await fetch(`/api/v1/public/proposals/${token}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId: getPublicSessionId() }),
      });

      if (response.ok) {
        setStatus('success');
        onSubmitted();
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      setError(payload?.error ?? 'Não foi possível enviar o pedido.');
      setStatus('error');
    } catch {
      setError('Não foi possível enviar o pedido. Verifique a ligação e tente novamente.');
      setStatus('error');
    }
  }

  return (
    <Dialog open={open} title="Pedir ajuste" onClose={onClose}>
      {status === 'success' ? (
        <div role="status" className="space-y-3">
          <p>Pedido enviado. A proposta voltou para revisão da agência.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="ajuste-observacao" className="block text-sm font-medium">
              Observação
            </label>
            <textarea
              id="ajuste-observacao"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-describedby="ajuste-observacao-contador ajuste-observacao-erro"
              className="mt-1 min-h-28 w-full rounded-md border border-foreground/20 bg-background p-2 text-sm"
            />
            <p
              id="ajuste-observacao-contador"
              className="mt-1 text-right text-xs text-muted-foreground"
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>

          {status === 'error' && error ? (
            <p id="ajuste-observacao-erro" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {status === 'submitting' ? 'A enviar…' : 'Enviar pedido'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}