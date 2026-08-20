/**
 * Preços da seleção pública de propostas.
 * A representação pública não expõe IDs internos; a seleção é indexada por
 * posição dentro de cada secção (nunca por identificador). Preços em cêntimos.
 */
import type { SectionMode } from './pricing';

export type PublicSelection = number[][];

export type PublicSelectionResult = { ok: true } | { ok: false; errors: string[] };

export interface PublicSelectableSection {
  mode: SectionMode;
  items: ReadonlyArray<unknown>;
}

export interface PublicPricedSection {
  mode: SectionMode;
  items: ReadonlyArray<{ priceDelta: number }>;
}

export function validatePublicSelection(
  sections: ReadonlyArray<PublicSelectableSection>,
  selection: PublicSelection,
): PublicSelectionResult {
  const errors: string[] = [];

  sections.forEach((section, sectionIndex) => {
    const selected = selection[sectionIndex] ?? [];
    if (selected.length === 0) {
      if (section.mode === 'single') {
        errors.push(`A secção ${sectionIndex + 1} exige uma escolha.`);
      }
      return;
    }
    if (section.mode === 'single' && selected.length > 1) {
      errors.push(`A secção ${sectionIndex + 1} aceita apenas uma escolha.`);
    }
    if (new Set(selected).size !== selected.length) {
      errors.push(`A secção ${sectionIndex + 1} contém escolhas duplicadas.`);
    }
    for (const itemIndex of selected) {
      if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= section.items.length) {
        errors.push(`A escolha ${itemIndex} não existe na secção ${sectionIndex + 1}.`);
      }
    }
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function calculatePublicTotal(
  baseAmount: number,
  sections: ReadonlyArray<PublicPricedSection>,
  selection: PublicSelection,
): number {
  const result = validatePublicSelection(sections, selection);
  if (!result.ok) {
    throw new Error(result.errors.join('; '));
  }

  let total = baseAmount;
  sections.forEach((section, sectionIndex) => {
    for (const itemIndex of selection[sectionIndex] ?? []) {
      total += section.items[itemIndex]?.priceDelta ?? 0;
    }
  });
  return total;
}