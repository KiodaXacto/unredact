// src/features/game/components/TokenSpan.tsx
// Single memoized token component.
// Receives ONLY primitive props so React.memo works correctly.
// This is the innermost render unit — must be as fast as possible.

import { memo } from 'react';

interface TokenSpanProps {
  id: number;
  text: string;
  pos: string;
  isStopWord: boolean;
  isPunctuation: boolean;
  isWhitespace: boolean;
  isParagraphBreak: boolean;
  revealed: boolean;
  posColorsEnabled: boolean;
}

// Map POS tag prefixes to data-pos attribute values for CSS styling
const getPosCategory = (pos: string): string | undefined => {
  if (pos.startsWith('NN')) return 'noun';
  if (pos.startsWith('VB')) return 'verb';
  if (pos === 'CD')         return 'number';
  if (pos.startsWith('JJ') || pos.startsWith('RB')) return 'adj';
  return undefined;
};

export const TokenSpan = memo(function TokenSpan({
  id,
  text,
  pos,
  isStopWord,
  isPunctuation,
  isWhitespace,
  isParagraphBreak,
  revealed,
  posColorsEnabled,
}: TokenSpanProps) {
  // Paragraph breaks render as block separators
  if (isParagraphBreak) {
    return <span className="block h-4" aria-hidden="true" />;
  }

  // Plain whitespace — preserves spacing between tokens
  if (isWhitespace) {
    return <span aria-hidden="true">{text}</span>;
  }

  // Punctuation — always visible, no spacing adjustment
  if (isPunctuation) {
    return (
      <span className="token-punctuation" aria-hidden="true">
        {text}
      </span>
    );
  }

  // Stop word — always visible, muted colour
  if (isStopWord) {
    return (
      <span className="token-stop-word">
        {text}
      </span>
    );
  }

  // Revealed word — show text, apply POS colours if enabled
  if (revealed) {
    const posCategory = posColorsEnabled ? getPosCategory(pos) : undefined;
    return (
      <span
        className="token-revealed"
        data-token-id={id}
        data-pos={posCategory}
      >
        {text}
      </span>
    );
  }

  // Redacted word — proportional black bar
  // Width is calculated from the word length to mimic the actual word shape
  const widthEm = Math.max(0.8, text.length * 0.55);

  return (
    <span
      className="token-redacted"
      style={{ width: `${widthEm}em` }}
      role="img"
      aria-label="redacted word"
      title={`${text.length} letters`}
      data-token-id={id}
    />
  );
});
