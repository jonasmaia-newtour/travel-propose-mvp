/**
 * Testes do diálogo base (T046): wrapper acessível do <dialog> nativo.
 * O jsdom não implementa showModal/close — stubs mínimos que refletem open.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '@/components/proposal/dialog';

afterEach(cleanup);

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe('Dialog', () => {
  it('abre com showModal quando open é true', () => {
    render(
      <Dialog open title="Título do diálogo" onClose={() => {}}>
        <p>Conteúdo</p>
      </Dialog>
    );
    expect((screen.getByRole('dialog') as HTMLDialogElement).open).toBe(true);
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('fecha quando open passa a false', () => {
    const { rerender } = render(
      <Dialog open title="Título do diálogo" onClose={() => {}}>
        <p>Conteúdo</p>
      </Dialog>
    );
    rerender(
      <Dialog open={false} title="Título do diálogo" onClose={() => {}}>
        <p>Conteúdo</p>
      </Dialog>
    );
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it('associa o título ao diálogo via aria-labelledby', () => {
    render(
      <Dialog open title="Título do diálogo" onClose={() => {}}>
        <p>Conteúdo</p>
      </Dialog>
    );
    const heading = screen.getByRole('heading', { name: 'Título do diálogo' });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('chama onClose ao clicar no botão Fechar', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Título do diálogo" onClose={onClose}>
        <p>Conteúdo</p>
      </Dialog>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('chama onClose quando o Esc é pressionado', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Título do diálogo" onClose={onClose}>
        <p>Conteúdo</p>
      </Dialog>
    );
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });
});