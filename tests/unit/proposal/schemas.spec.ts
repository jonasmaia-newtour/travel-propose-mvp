/**
 * Testes dos schemas de publicação de propostas.
 */
import { describe, it, expect } from 'vitest';
import { proposalDraftSchema, proposalPublishSchema } from '../../../schemas/proposal';

const validaFutura = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const passado = new Date(Date.now() - 60 * 1000).toISOString();

const propostaValida = {
  title: 'Lua de mel no Algarve',
  base_amount: 120000,
  expires_at: validaFutura,
  sections: [
    {
      title: 'Alojamento',
      mode: 'single' as const,
      order: 0,
      items: [{ title: 'Quarto duplo', price_delta: 0 }],
    },
  ],
};

describe('proposalPublishSchema', () => {
  it('aceita uma proposta completa e válida', () => {
    const result = proposalPublishSchema.safeParse(propostaValida);
    expect(result.success).toBe(true);
  });

  it('exige título para publicar', () => {
    const result = proposalPublishSchema.safeParse({ ...propostaValida, title: '' });
    expect(result.success).toBe(false);
  });

  it('exige validade futura', () => {
    const semValidade = proposalPublishSchema.safeParse({ ...propostaValida, expires_at: undefined });
    const noPassado = proposalPublishSchema.safeParse({ ...propostaValida, expires_at: passado });
    expect(semValidade.success).toBe(false);
    expect(noPassado.success).toBe(false);
  });

  it('exige pelo menos uma secção', () => {
    const result = proposalPublishSchema.safeParse({ ...propostaValida, sections: [] });
    expect(result.success).toBe(false);
  });

  it('rejeita secção sem itens selecionáveis', () => {
    const result = proposalPublishSchema.safeParse({
      ...propostaValida,
      sections: [{ title: 'Vazia', mode: 'multiple' as const, order: 1, items: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('aceita rascunho incompleto no schema de rascunho', () => {
    const result = proposalDraftSchema.safeParse({ title: '', sections: [] });
    expect(result.success).toBe(true);
  });
});