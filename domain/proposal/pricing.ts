/**
 * Domínio de preços e seleção de propostas.
 * Todos os valores monetários são inteiros em cêntimos (precisão decimal).
 */
export type SectionMode = 'single' | 'multiple';

export interface PricedItem {
  id: string;
  priceDelta: number;
}

export interface Section {
  id: string;
  mode: SectionMode;
  items: PricedItem[];
}

export type Selection = Record<string, string[]>;

export type SelectionResult = { ok: true } | { ok: false; errors: string[] };

export function validateSelection(sections: Section[], selection: Selection): SelectionResult {
  const errors: string[] = [];
  const itemsById = new Map(
    sections.flatMap((section) => section.items.map((item) => [item.id, section.id] as const))
  );

  for (const section of sections) {
    const selected = selection[section.id] ?? [];
    if (selected.length === 0) {
      if (section.mode === 'single') {
        errors.push(`A secção "${section.id}" exige uma escolha.`);
      }
      continue;
    }
    if (section.mode === 'single' && selected.length > 1) {
      errors.push(`A secção "${section.id}" aceita apenas uma escolha.`);
    }
    if (new Set(selected).size !== selected.length) {
      errors.push(`A secção "${section.id}" contém escolhas duplicadas.`);
    }
    for (const itemId of selected) {
      const ownerId = itemsById.get(itemId);
      if (ownerId === undefined) {
        errors.push(`O item "${itemId}" não existe.`);
      } else if (ownerId !== section.id) {
        errors.push(`O item "${itemId}" pertence a outra secção.`);
      }
    }
  }

  for (const sectionId of Object.keys(selection)) {
    if (!sections.some((section) => section.id === sectionId)) {
      errors.push(`A secção "${sectionId}" não existe.`);
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function calculateTotal(
  baseAmount: number,
  sections: Section[],
  selection: Selection
): number {
  const result = validateSelection(sections, selection);
  if (!result.ok) {
    throw new Error(result.errors.join('; '));
  }

  const priceDelta = new Map(
    sections.flatMap((section) => section.items.map((item) => [item.id, item.priceDelta] as const))
  );

  let total = baseAmount;
  for (const section of sections) {
    for (const itemId of selection[section.id] ?? []) {
      total += priceDelta.get(itemId) ?? 0;
    }
  }
  return total;
}