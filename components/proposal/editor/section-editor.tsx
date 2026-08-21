'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash, ListDashes } from '@phosphor-icons/react';

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
    <Card className="p-5 border-border shadow-xs bg-slate-50/30">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ListDashes size={20} weight="regular" className="text-royal-blue" />
          <h3 className="font-semibold text-royal-blue text-base">Secção da Proposta</h3>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash size={16} weight="regular" className="mr-1.5" />
          Remover secção
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem] mb-6">
        <div>
          <label htmlFor={`section-title-${section.key}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
            Título da secção
          </label>
          <Input
            id={`section-title-${section.key}`}
            type="text"
            required
            maxLength={120}
            placeholder="Ex: Alojamento, Voos, Experiências"
            value={section.title}
            onChange={(event) => onChange({ ...section, title: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`section-mode-${section.key}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-gray">
            Tipo de escolha
          </label>
          <select
            id={`section-mode-${section.key}`}
            value={section.mode}
            onChange={(event) =>
              onChange({ ...section, mode: event.target.value as EditorSection['mode'] })
            }
            className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue"
          >
            <option value="single">Escolha única (Rádio)</option>
            <option value="multiple">Escolha múltipla (Checkboxes)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-gray">Itens da Secção</h4>
          <span className="text-xs text-slate-gray">{section.items.length} item(ns)</span>
        </div>

        {section.items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-gray border border-dashed border-border rounded-lg bg-white">
            Sem itens nesta secção. Clique abaixo para adicionar.
          </div>
        ) : (
          <div className="space-y-3">
            {section.items.map((item, itemIndex) => (
              <Card key={item.key} className="p-4 bg-white border-border shadow-xs">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-royal-blue uppercase tracking-wide">
                    Item #{itemIndex + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.key)}
                    className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash size={14} className="mr-1" />
                    Remover
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`item-title-${item.key}`} className="mb-1 block text-xs text-slate-gray">
                      Título do item
                    </label>
                    <Input
                      id={`item-title-${item.key}`}
                      type="text"
                      required
                      maxLength={120}
                      placeholder="Ex: Quarto Duplo Vista Mar"
                      value={item.title}
                      onChange={(event) => updateItem(item.key, { title: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`item-delta-${item.key}`} className="mb-1 block text-xs text-slate-gray">
                      Variação de preço (€)
                    </label>
                    <Input
                      id={`item-delta-${item.key}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={(item.priceDeltaCents / 100).toFixed(2)}
                      onChange={(event) =>
                        updateItem(item.key, {
                          priceDeltaCents: Math.round((Number(event.target.value) || 0) * 100),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`item-description-${item.key}`} className="mb-1 block text-xs text-slate-gray">
                      Descrição
                    </label>
                    <Input
                      id={`item-description-${item.key}`}
                      type="text"
                      maxLength={500}
                      placeholder="Detalhes opcionais do item"
                      value={item.description}
                      onChange={(event) => updateItem(item.key, { description: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`item-image-${item.key}`} className="mb-1 block text-xs text-slate-gray">
                      URL da imagem (opcional)
                    </label>
                    <Input
                      id={`item-image-${item.key}`}
                      type="url"
                      maxLength={2048}
                      placeholder="https://..."
                      value={item.imageUrl}
                      onChange={(event) => updateItem(item.key, { imageUrl: event.target.value })}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="mt-2 text-royal-blue border-royal-blue/30 hover:bg-royal-blue/5"
      >
        <Plus size={16} weight="regular" className="mr-1.5" />
        Adicionar item
      </Button>
    </Card>
  );
}
