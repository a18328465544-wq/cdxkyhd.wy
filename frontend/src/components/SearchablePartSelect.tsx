import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useState } from "react";
import { filterParts, type PartSearchItem } from "../lib/partSearch";

interface SearchablePartSelectProps {
  parts: PartSearchItem[];
  value: string;
  placeholder: string;
  loading?: boolean;
  onChange: (value: string) => void;
}

function getStockLabel(quantity?: number) {
  const count = quantity ?? 0;
  return count <= 0 ? "缺货" : `库存 ${count} 件`;
}

export default function SearchablePartSelect({ parts, value, placeholder, loading = false, onChange }: SearchablePartSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = parts.find(part => part.id === value) ?? null;

  return (
    <BaseCombobox.Root<PartSearchItem>
      items={parts}
      value={selected}
      onValueChange={part => onChange(part?.id ?? "")}
      itemToStringLabel={part => part.name}
      itemToStringValue={part => part.id}
      isItemEqualToValue={(part, current) => part.id === current.id}
      filter={(part, query) => filterParts([part], query).length > 0}
      limit={60}
      open={open && !loading}
      onOpenChange={setOpen}
      disabled={loading}
      autoHighlight
    >
      <BaseCombobox.InputGroup data-erp-control="combobox">
        <Search className="h-4 w-4 shrink-0 text-[var(--erp-color-text-muted)]" aria-hidden="true" />
        <BaseCombobox.Input
          aria-label={placeholder}
          placeholder={loading ? "正在加载库存硬件..." : placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--erp-color-text)] outline-none placeholder:text-[var(--erp-color-text-muted)]"
        />
        {selected && !loading && (
          <BaseCombobox.Clear aria-label="清除已选硬件" data-erp-control="combobox-action">
            <X className="h-4 w-4" aria-hidden="true" />
          </BaseCombobox.Clear>
        )}
        <BaseCombobox.Trigger aria-label="展开硬件列表" data-erp-control="combobox-action">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="z-[100] max-w-[calc(100vw-1.5rem)] outline-none" sideOffset={4} align="start">
          <BaseCombobox.Popup data-erp-control="select-popup" className="w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] p-1">
            <BaseCombobox.Empty className="px-3 py-4 text-center text-xs text-[var(--erp-color-text-muted)]">
              {parts.length === 0 ? "暂无可选硬件" : "未找到匹配硬件"}
            </BaseCombobox.Empty>
            <BaseCombobox.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto">
              {(part: PartSearchItem) => (
                <BaseCombobox.Item key={part.id} value={part} data-erp-control="combobox-option">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{part.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--erp-color-text-muted)]">
                      {part.condition} · ¥{part.price.toLocaleString()} · {getStockLabel(part.quantity)}
                    </span>
                  </span>
                  <BaseCombobox.ItemIndicator className="shrink-0 text-[var(--erp-color-primary)]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
