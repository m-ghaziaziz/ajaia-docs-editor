'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
import EditorToolbar from './EditorToolbar';

interface TiptapEditorProps {
  content: object | null;
  canEdit: boolean;
  onUpdate: (json: object, text: string) => void;
  insertedImage?: string | null;
  onImageInserted?: () => void;
}

export default function TiptapEditor({ content, canEdit, onUpdate, insertedImage, onImageInserted }: TiptapEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
      CharacterCount,
      Image.configure({ inline: true }),
    ],
    editable: canEdit,
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onUpdateRef.current(json, text);
    },
    onCreate: () => setIsReady(true),
  });

  // Sync editable
  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [editor, canEdit]);

  // Load initial content when fetched
  const contentLoaded = useRef(false);
  useEffect(() => {
    if (editor && content && !contentLoaded.current) {
      contentLoaded.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.commands.setContent(content as any, false);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor && insertedImage) {
      editor.chain().focus().setImage({ src: insertedImage }).run();
      if (onImageInserted) onImageInserted();
    }
  }, [editor, insertedImage, onImageInserted]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {canEdit && isReady && editor && <EditorToolbar editor={editor} />}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 24px',
        background: 'var(--bg-overlay)',
      }}>
        <div style={{ 
          maxWidth: 850, 
          margin: '0 auto', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 4,
          boxShadow: 'var(--shadow-md)', 
          minHeight: '100%', 
          padding: '48px 64px' 
        }}>
          <EditorContent editor={editor} className="tiptap-editor" />
        </div>
      </div>
      <div style={{
        padding: '8px 24px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        {!canEdit && <span style={{ color: 'var(--color-warning)', fontSize: 12 }}>👁 View only</span>}
      </div>
    </div>
  );
}
