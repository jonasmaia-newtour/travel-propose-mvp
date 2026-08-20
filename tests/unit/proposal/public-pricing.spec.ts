/**
 * Testes do cálculo de preços da seleção pública (indexada por posição).
 * A representação pública nunca expõe IDs internos; a seleção usa índices.
 * Preços em cêntimos (inteiros).
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePublicTotal,
  validatePublicSelection,
  type PublicPricedSection,
  type PublicSelectableSection,
} from '../../../domain/proposal/public-pricing';

const sections: PublicPricedSection[] = [
  {
    mode: 'single',
    items: [
      { priceDelta: 0 },
      { priceDelta: 15000 },
    ],
  },
  {
    mode: 'multiple',
    items: [
      { priceDelta: 20000 },
      { priceDelta: 10000 },
    ],
  },
];

describe('validatePublicSelection', () => {
  it('aceita seleção válida de escolha única e múltipla', () => {
    const result = validatePublicSelection(sections, [[0], [0, 1]]);
    expect(result.ok).toBe(true);
  });

  it('aceita secção múltipla sem itens selecionados', () => {
    const result = validatePublicSelection(sections, [[0], []]);
    expect(result.ok).toBe(true);
  });

  it('exige exatamente um item numa secção de escolha única', () => {
    expect(validatePublicSelection(sections, [[], []]).ok).toBe(false);
    expect(validatePublicSelection(sections, [[0, 1], []]).ok).toBe(false);
  });

  it('rejeita índice de item inexistente', () => {
    expect(validatePublicSelection(sections, [[0], [7]]).ok).toBe(false);
  });

  it('rejeita escolhas duplicadas numa seleção múltipla', () => {
    expect(validatePublicSelection(sections, [[0], [0, 0]]).ok).toBe(false);
  });

  it('rejeita índices não inteiros ou negativos', () => {
    expect(validatePublicSelection(sections, [[0], [-1]]).ok).toBe(false);
    expect(validatePublicSelection(sections, [[0], [0.5]]).ok).toBe(false);
  });

  it('devolve erros descritivos sem expor dados sensíveis', () => {
    const result = validatePublicSelection(sections, [[]]);
    if (result.ok) throw new Error('esperava falha');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('calculatePublicTotal', () => {
  it('o total é a base mais a soma dos deltas selecionados', () => {
    const total = calculatePublicTotal(100000, sections, [[1], [0, 1]]);
    expect(total).toBe(100000 + 15000 + 20000 + 10000);
  });

  it('ignora itens não selecionados', () => {
    const total = calculatePublicTotal(100000, sections, [[0], []]);
    expect(total).toBe(100000);
  });

  it('aceita deltas negativos (desconto)', () => {
    const comDesconto: PublicPricedSection[] = [
      { mode: 'multiple', items: [{ priceDelta: -5000 }] },
    ];
    const total = calculatePublicTotal(100000, comDesconto, [[0]]);
    expect(total).toBe(95000);
  });

  it('mantém precisão decimal sem vírgula flutuante', () => {
    const fracionado: PublicPricedSection[] = [
      { mode: 'multiple', items: [{ priceDelta: 1 }, { priceDelta: 3 }] },
    ];
    const total = calculatePublicTotal(1, fracionado, [[0, 1]]);
    expect(total).toBe(5);
  });

  it('lança erro quando a seleção é inválida', () => {
    expect(() => calculatePublicTotal(100000, sections, [[], []])).toThrow(/escolha/i);
  });
});

describe('tipos da seleção pública', () => {
  it('aceita secções compatíveis com a representação pública', () => {
    const publicSections: PublicSelectableSection[] = [
      { mode: 'single', items: [{}, {}] },
      { mode: 'multiple', items: [{}, {}, {}] },
    ];
    expect(validatePublicSelection(publicSections, [[0], [1, 2]]).ok).toBe(true);
  });
});