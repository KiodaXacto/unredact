// src/features/game/components/ArticleRenderer.tsx
// Renders the full token array as a readable article with redacted blocks.
// Performance: React.memo + memoized paragraph grouping = only changed tokens re-render.

import { memo, useMemo } from 'react';
import type { Token } from '@features/game/types';
import { TokenSpan } from './TokenSpan';

interface ArticleRendererProps {
  tokens: Token[];
  posColorsEnabled: boolean;
}

/**
 * Group the flat token array into paragraphs by splitting on paragraph breaks.
 * Returns: Token[][] — each inner array is one paragraph.
 */
const groupIntoParagraphs = (tokens: Token[]): Token[][] => {
  const paragraphs: Token[][] = [];
  let current: Token[] = [];

  for (const token of tokens) {
    if (token.isParagraphBreak) {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }

  // Push final paragraph
  if (current.length > 0) {
    paragraphs.push(current);
  }

  return paragraphs;
};

export const ArticleRenderer = memo(function ArticleRenderer({
  tokens,
  posColorsEnabled,
}: ArticleRendererProps) {
  // Recompute paragraph groups only when the token array reference changes
  // (which happens once on puzzle load — not on every guess)
  const paragraphs = useMemo(() => groupIntoParagraphs(tokens), [tokens]);

  if (tokens.length === 0) {
    return (
      <div className="article-renderer animate-pulse">
        {/* Skeleton loading state */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 h-4 rounded"
            style={{
              backgroundColor: 'var(--color-bg-redacted)',
              width: `${60 + Math.random() * 35}%`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <article
      id="main-content"
      className="article-renderer"
      aria-label="Wikipedia article — redacted. Type words to reveal them."
    >
      {paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex} className="mb-4">
          {paragraph.map((token) => (
            <TokenSpan
              key={token.id}
              id={token.id}
              text={token.text}
              pos={token.pos}
              isStopWord={token.isStopWord}
              isPunctuation={token.isPunctuation}
              isWhitespace={token.isWhitespace}
              isParagraphBreak={token.isParagraphBreak}
              revealed={token.revealed}
              posColorsEnabled={posColorsEnabled}
            />
          ))}
        </p>
      ))}
    </article>
  );
});
