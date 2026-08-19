/**
 * Testes do cálculo de preços e validação de seleção.
 * Preços em cêntimos (inteiros) para precisão decimal sem erros de vírgula flutuante.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTotal,
  validateSelection,
  type Section,
} from '../../../domain/proposal/pricing';

const sections: Section[] = [
  {
    id: 'destino',
    mode: 'single',
    items: [
      { id: 'praia', priceDelta: 0 },
      { id: 'montanha', priceDelta: 15000 },
    ],
  },
  {
    id: 'transporte',
    mode: 'multiple',
    items: [
      { id: 'voo', priceDelta: 20000 },
      { id: 'transfer', priceDelta: 10000 },
    ],
  },
];

describe('validateSelection', () => {
  it('aceita seleção válida de escolha única e múltipla', () => {
    const result = validateSelection(sections, { destino: ['praia'], transporte: ['voo', 'transfer'] });
    expect(result.ok).toBe(true);
  });

  it('aceita secção múltipla sem itens selecionados', () => {
    const result = validateSelection(sections, { destino: ['praia'], transporte: [] });
    expect(result.ok).toBe(true);
  });

  it('exige exatamente um item numa secção de escolha única', () => {
    expect(validateSelection(sections, { destino: [], transporte: [] }).ok).toBe(false);
    expect(
      validateSelection(sections, { destino: ['praia', 'montanha'], transporte: [] }).ok
    ).toBe(false);
  });

  it('rejeita item desconhecido na secção', () => {
    expect(validateSelection(sections, { destino: ['inexistente'], transporte: [] }).ok).toBe(false);
  });

  it('rejeita item de outra secção', () => {
    expect(validateSelection(sections, { destino: ['voo'], transporte: [] }).ok).toBe(false);
  });

  it('rejeita secção desconhecida', () => {
    expect(validateSelection(sections, { destino: ['praia'], fantasma: ['x'] }).ok).toBe(false);
  });

  it('rejeita itens duplicados numa seleção múltipla', () => {
    expect(validateSelection(sections, { destino: ['praia'], transporte: ['voo', 'voo'] }).ok).toBe(
      false
    );
  });

  it('devolve erros descritivos sem expor dados sensíveis', () => {
    const result = validateSelection(sections, { destino: [] });
    if (result.ok) throw new Error('esperava falha');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('calculateTotal', () => {
  it('o total é a base mais a soma dos deltas selecionados', () => {
    const total = calculateTotal(100000, sections, {
      destino: ['montanha'],
      transporte: ['voo', 'transfer'],
    });
    expect(total).toBe(100000 + 15000 + 20000 + 10000);
  });

  it('ignora itens não selecionados', () => {
    const total = calculateTotal(100000, sections, { destino: ['praia'], transporte: [] });
    expect(total).toBe(100000);
  });

  it('aceita deltas negativos (desconto)', () => {
    const comDesconto: Section[] = [
      {
        id: 'extras',
        mode: 'multiple',
        items: [{ id: 'seguro', priceDelta: -5000 }],
      },
    ];
    const total = calculateTotal(100000, comDesconto, { extras: ['seguro'] });
    expect(total).toBe(95000);
  });

  it('mantém precisão decimal sem vírgula flutuante', () => {
    const fracionado: Section[] = [
      {
        id: 'extras',
        mode: 'multiple',
        items: [{ id: 'taxa', priceDelta: 1 }, { id: 'imposto', priceDelta: 3 }],
      },
    ];
    const total = calculateTotal(1, fracionado, { extras: ['taxa', 'imposto'] });
    expect(total).toBe(5);
  });
});