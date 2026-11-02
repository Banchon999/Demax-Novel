import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { findMentions, type Term } from "@/lib/codex/mentions";

export const mentionsKey = new PluginKey<DecorationSet>("codexMentions");
/** Dispatch a transaction with this meta to re-scan after the codex changes. */
export const REFRESH_META = "codexMentionsRefresh";

type Options = {
  getTerms: () => Term[];
  getColor: (entityId: string) => string;
  onMentionClick: (entityId: string) => void;
};

function decorate(doc: PMNode, opts: Options): DecorationSet {
  const terms = opts.getTerms();
  if (!terms.length) return DecorationSet.empty;
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // One char per inline position (leaf nodes become a single placeholder),
    // so string offsets map straight back to document positions.
    const text = node.textBetween(0, node.content.size, undefined, "￼");
    for (const m of findMentions(text, terms)) {
      decos.push(
        Decoration.inline(pos + 1 + m.from, pos + 1 + m.to, {
          class: "codex-mention",
          "data-entity": m.entityId,
          style: `--mention:${opts.getColor(m.entityId)}`,
        }),
      );
    }
    return false;
  });
  return DecorationSet.create(doc, decos);
}

/** Underlines codex names/aliases as you type; tapping one opens its card. */
export const CodexMentions = Extension.create<Options>({
  name: "codexMentions",
  addOptions() {
    return { getTerms: () => [], getColor: () => "#a78bfa", onMentionClick: () => {} };
  },
  addProseMirrorPlugins() {
    const opts = this.options;
    return [
      new Plugin({
        key: mentionsKey,
        state: {
          init: (_, state) => decorate(state.doc, opts),
          apply: (tr, old) => (tr.docChanged || tr.getMeta(REFRESH_META) ? decorate(tr.doc, opts) : old.map(tr.mapping, tr.doc)),
        },
        props: {
          decorations: (state) => mentionsKey.getState(state),
          handleClick: (_view, _pos, event) => {
            const el = (event.target as HTMLElement | null)?.closest?.("[data-entity]");
            const id = el?.getAttribute("data-entity");
            if (id) opts.onMentionClick(id);
            return false; // still place the caret
          },
        },
      }),
    ];
  },
});
