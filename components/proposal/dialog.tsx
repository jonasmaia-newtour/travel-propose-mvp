'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Diálogo base acessível (T046): wrapper do <dialog> nativo com gestão de
 * modal (showModal/close), título associado por aria-labelledby, fecho por
 * Esc (evento cancel) e por botão. O conteúdo e as ações são fornecidos
 * pelo consumidor; o foco e a navegação por teclado são os do diálogo modal
 * nativo do browser (WCAG AA).
 */
interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, title, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-md rounded-lg border border-foreground/10 bg-card p-6 text-card-foreground shadow-lg backdrop:bg-background/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Fechar
        </button>
      </header>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}