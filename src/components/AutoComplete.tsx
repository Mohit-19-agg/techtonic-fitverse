import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, ChevronRight } from 'lucide-react';

interface AutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
  customLabel?: string;
  icon?: typeof Search;
  maxSuggestions?: number;
}

export function AutoComplete({
  value,
  onChange,
  suggestions,
  placeholder = 'Search...',
  label,
  allowCustom = true,
  customLabel = 'Use custom value',
  icon: Icon,
  maxSuggestions = 8,
}: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      )
    : suggestions;

  const visibleSuggestions = filtered.slice(0, maxSuggestions);
  const showAddCustom =
    allowCustom &&
    value.length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === value.toLowerCase());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(suggestion: string) {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    const totalItems = visibleSuggestions.length + (showAddCustom ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < visibleSuggestions.length) {
        handleSelect(visibleSuggestions[highlightedIndex]);
      } else if (showAddCustom) {
        handleSelect(value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="label-field">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input-field ${Icon ? 'pl-11' : ''} ${isOpen && (visibleSuggestions.length > 0 || showAddCustom) ? 'ring-2 ring-emerald-500/50' : ''}`}
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (visibleSuggestions.length > 0 || showAddCustom) && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-slate-900 ring-1 ring-inset ring-slate-700 shadow-2xl shadow-black/50 overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
          {visibleSuggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                highlightedIndex === i
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate">{suggestion}</span>
              {value && suggestion.toLowerCase().startsWith(value.toLowerCase()) && (
                <ChevronRight className="w-4 h-4 ml-auto text-emerald-400 flex-shrink-0" />
              )}
            </button>
          ))}

          {showAddCustom && (
            <button
              type="button"
              onClick={() => handleSelect(value)}
              onMouseEnter={() => setHighlightedIndex(visibleSuggestions.length)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm border-t border-slate-700/50 transition-colors ${
                highlightedIndex === visibleSuggestions.length
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{customLabel}: "{value}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
