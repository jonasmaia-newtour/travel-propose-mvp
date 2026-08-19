'use client';

export interface EditorItem {
  key: string;
  title: string;
  description: string;
  imageUrl: string;
  priceDeltaCents: number;
}

export interface EditorSection {
  key: string;
  title: string;
  mode: 'single' | 'multiple';
  items: EditorItem[];
}

const inputClass =
  'w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground';

export function SectionEditor({
  section,
  onChange,
  onRemove,
}: {
  section: EditorSection;
  onChange: (next: EditorSection) => void;
  onRemove: () => void;
}) {
  function updateItem(itemKey: string, patch: Partial<EditorItem>) {
    onChange({
      ...section,
      items: section.items.map((item) =>
        item.key === itemKey ? { ...item, ...patch } : item
      ),
    });
  }

  function addItem() {
    onChange({
      ...section,
      items: [
        ...section.items,
        { key: crypto.randomUUID(), title: '', description: '', imageUrl: '', priceDeltaCents: 0 },
      ],
    });
  }

  function removeItem(itemKey: string) {
    onChange({ ...section, items: section.items.filter((item) => item.key !== itemKey) });
  }

  return (
    <fieldset className="space-y-4 rounded-lg border border-foreground/10 p-4">
      <legend className="px-1 text-sm font-medium text-foreground">Secção</legend>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor={`section-title-${section.key}`} className="mb-1 block text-sm text-foreground">
            Título da secção
          </label>
          <input
            id={`section-title-${section.key}`}
            type="text"
            required
            maxLength={120}
            value={section.title}
            onChange={(event) => onChange({ ...section, title: event.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`section-mode-${section.key}`} className="mb-1 block text-sm text-foreground">
            Tipo de escolha
          </label>
          <select
            id={`section-mode-${section.key}`}
            value={section.mode}
            onChange={(event) =>
              onChange({ ...section, mode: event.target.value as EditorSection['mode'] })
            }
            className={inputClass}
          >
            <option value="single">Escolha única</option>
            <option value="multiple">Escolha múltipla</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {section.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem itens nesta secção.</p>
        ) : (
          section.items.map((item, itemIndex) => (
            <div
              key={item.key}
              className="rounded-md border border-foreground/10 bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-card-foreground">Item {itemIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-foreground/5"
                >
                  Remover
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`item-title-${item.key}`} className="mb-1 block text-sm text-foreground">
                    Título
                  </label>
                  <input
                    id={`item-title-${item.key}`}
                    type="text"
                    required
                    maxLength={120}
                    value={item.title}
                    onChange={(event) => updateItem(item.key, { title: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`item-delta-${item.key}`} className="mb-1 block text-sm text-foreground">
                    Variação de preço (€)
                  </label>
                  <input
                    id={`item-delta-${item.key}`}
                    type="number"
                    step="0.01"
                    value={(item.priceDeltaCents / 100).toFixed(2)}
                    onChange={(event) =>
                      updateItem(item.key, {
                        priceDeltaCents: Math.round((Number(event.target.value) || 0) * 100),
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`item-description-${item.key}`} className="mb-1 block text-sm text-foreground">
                    Descrição
                  </label>
                  <input
                    id={`item-description-${item.key}`}
                    type="text"
                    maxLength={500}
                    value={item.description}
                    onChange={(event) => updateItem(item.key, { description: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`item-image-${item.key}`} className="mb-1 block text-sm text-foreground">
                    URL da imagem (opcional)
                  </label>
                  <input
                    id={`item-image-${item.key}`}
                    type="url"
                    maxLength={2048}
                    value={item.imageUrl}
                    onChange={(event) => updateItem(item.key, { imageUrl: event.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground"
        >
          Adicionar item
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5"
        >
          Remover secção
        </button>
      </div>
    </fieldset>
  );
}