export type TextCount = { words: number; chars: number };

let segmenter: Intl.Segmenter | null = null;

/**
 * Thai has no spaces between words, so splitting on whitespace undercounts
 * badly. Intl.Segmenter uses ICU's dictionary-based word breaking instead.
 */
export function countText(text: string): TextCount {
  segmenter ??= new Intl.Segmenter("th", { granularity: "word" });
  let words = 0;
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) words++;
  }
  const chars = text.replace(/\s/g, "").length;
  return { words, chars };
}
