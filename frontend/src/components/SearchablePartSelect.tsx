import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

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
  if (count <= 0) return "缺货";
  return `库存 ${count} 件`;
}

export default function SearchablePartSelect({
  parts,
  value,
  placeholder,
  loading = false,
  onChange,
}: SearchablePartSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedPart = parts.find(part => part.id === value);
  const visibleParts = useMemo(() => filterParts(parts, query), [parts, query]);
  const inputValue = isOpen ? query : selectedPart?.name ?? "";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
      setQuery("");
      setHighlightedIndex(-1);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (highlightedIndex < visibleParts.length) return;
    setHighlightedIndex(visibleParts.length > 0 ? visibleParts.length - 1 : -1);
  }, [highlightedIndex, visibleParts.length]);

  const openSearch = () => {
    setQuery("");
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const selectPart = (part: PartSearchItem) => {
    onChange(part.id);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputClick = () => {
    if (!isOpen) openSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openSearch();
        setHighlightedIndex(0);
        return;
      }
      setHighlightedIndex(current => Math.min(current + 1, visibleParts.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(current => current <= 0 ? Math.max(visibleParts.length - 1, 0) : current - 1);
      return;
    }

    if (event.key === "Enter" && isOpen && highlightedIndex >= 0) {
      event.preventDefault();
      const highlightedPart = visibleParts[highlightedIndex];
      if (highlightedPart) selectPart(highlightedPart);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery("");
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div className={`flex h-11 min-w-0 items-center rounded-lg border bg-white transition ${
        isOpen ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200 hover:border-slate-300"
      }`}>
        <Search className="ml-3 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          autoComplete="off"
          disabled={loading}
          value={inputValue}
          placeholder={loading ? "正在加载库存硬件..." : placeholder}
          onFocus={openSearch}
          onClick={handleInputClick}
          onChange={event => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-xs placeholder:text-slate-400 disabled:cursor-wait"
        />

        {value && !loading ? (
          <button
            type="button"
            aria-label="清除已选硬件"
            title="清除已选硬件"
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
              onChange("");
              setQuery("");
              setIsOpen(false);
            }}
            className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown
            className={`mr-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && !loading && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {parts.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-500">暂无可选硬件</p>
          ) : visibleParts.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-500">未找到匹配硬件</p>
          ) : (
            visibleParts.map((part, index) => {
              const isSelected = part.id === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={part.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectPart(part)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    isHighlighted ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{part.name}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {part.condition} · ¥{part.price.toLocaleString()} · {getStockLabel(part.quantity)}
                    </span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
