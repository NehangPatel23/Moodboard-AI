'use client';

import { Button } from '@/components/ui/button';

type PromptSuggestionsProps = {
  suggestions: string[];
  onSelect: (prompt: string) => void;
};

export function PromptSuggestions({ suggestions, onSelect }: PromptSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}