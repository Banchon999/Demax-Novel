"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import type { ReactNode } from "react";
import {
  BoldIcon,
  HeadingIcon,
  ItalicIcon,
  QuoteIcon,
  RedoIcon,
  SceneBreakIcon,
  UndoIcon,
} from "@/components/icons";
import type { ChapterContent } from "@/lib/db/schema";

type ProseContent = Extract<ChapterContent, { kind: "prose" }>;

export function ProseEditor({
  initial,
  onChange,
  fontSize,
  showToolbar,
}: {
  initial: ProseContent;
  onChange: (content: ChapterContent) => void;
  fontSize: number;
  showToolbar: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: false,
      }),
      Placeholder.configure({ placeholder: "เริ่มเขียนเรื่องของคุณที่นี่…" }),
    ],
    content: initial.doc,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-editor",
        "aria-label": "เนื้อเรื่อง",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor }) => onChange({ kind: "prose", doc: editor.getJSON() }),
  });

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto" style={{ fontSize }}>
        <div className="mx-auto max-w-2xl px-5 pb-24 pt-4">
          <EditorContent editor={editor} />
        </div>
      </div>
      {showToolbar && editor && <Toolbar editor={editor} />}
    </>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      heading: e.isActive("heading", { level: 2 }),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="จัดรูปแบบข้อความ"
      className="flex shrink-0 items-center justify-between gap-1 overflow-x-auto border-t border-white/10 bg-surface px-2 py-1"
    >
      <Tool label="ตัวหนา" active={s.bold} onRun={() => chain().toggleBold().run()}>
        <BoldIcon className="size-5" />
      </Tool>
      <Tool label="ตัวเอียง" active={s.italic} onRun={() => chain().toggleItalic().run()}>
        <ItalicIcon className="size-5" />
      </Tool>
      <Tool label="หัวข้อ" active={s.heading} onRun={() => chain().toggleHeading({ level: 2 }).run()}>
        <HeadingIcon className="size-5" />
      </Tool>
      <Tool label="ข้อความอ้างอิง / ความคิด" active={s.quote} onRun={() => chain().toggleBlockquote().run()}>
        <QuoteIcon className="size-5" />
      </Tool>
      <Tool label="เส้นคั่นฉาก" onRun={() => chain().setHorizontalRule().run()}>
        <SceneBreakIcon className="size-5" />
      </Tool>
      <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />
      <Tool label="เลิกทำ" disabled={!s.canUndo} onRun={() => chain().undo().run()}>
        <UndoIcon className="size-5" />
      </Tool>
      <Tool label="ทำซ้ำ" disabled={!s.canRedo} onRun={() => chain().redo().run()}>
        <RedoIcon className="size-5" />
      </Tool>
    </div>
  );
}

function Tool({
  label,
  active = false,
  disabled = false,
  onRun,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onRun: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus (and the phone keyboard) in the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onRun}
      className={`grid size-10 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-30 ${
        active ? "bg-accent/25 text-accent-soft" : "text-fg/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
