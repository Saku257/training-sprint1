'use client';

type Suggestion = {
  id: string;
  text: string;
};

type SuggestionChipsProps = {
  suggestions: Suggestion[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function SuggestionChips({ suggestions, onSelect, disabled = false }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion.text)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
}
