'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  Quote, Minus,
} from 'lucide-react';

interface ToolbarProps { editor: Editor; }

type ToolbarItem =
  | { type: 'button'; label: string; icon: React.ComponentType<{ size: number }>; action: () => void; isActive: () => boolean }
  | { type: 'divider' };

export default function EditorToolbar({ editor }: ToolbarProps) {
  const btn = (
    label: string,
    Icon: React.ComponentType<{ size: number }>,
    action: () => void,
    isActive: () => boolean
  ): ToolbarItem => ({ type: 'button', label, icon: Icon, action, isActive });

  const groups: ToolbarItem[][] = [
    [
      btn('Undo', Undo, () => editor.chain().focus().undo().run(), () => false),
      btn('Redo', Redo, () => editor.chain().focus().redo().run(), () => false),
    ],
    [
      btn('Heading 1', Heading1, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), () => editor.isActive('heading', { level: 1 })),
      btn('Heading 2', Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), () => editor.isActive('heading', { level: 2 })),
      btn('Heading 3', Heading3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), () => editor.isActive('heading', { level: 3 })),
    ],
    [
      btn('Bold', Bold, () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')),
      btn('Italic', Italic, () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')),
      btn('Underline', Underline, () => editor.chain().focus().toggleUnderline().run(), () => editor.isActive('underline')),
      btn('Strikethrough', Strikethrough, () => editor.chain().focus().toggleStrike().run(), () => editor.isActive('strike')),
    ],
    [
      btn('Bullet List', List, () => editor.chain().focus().toggleBulletList().run(), () => editor.isActive('bulletList')),
      btn('Ordered List', ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), () => editor.isActive('orderedList')),
      btn('Blockquote', Quote, () => editor.chain().focus().toggleBlockquote().run(), () => editor.isActive('blockquote')),
      btn('Divider', Minus, () => editor.chain().focus().setHorizontalRule().run(), () => false),
    ],
    [
      btn('Align Left', AlignLeft, () => editor.chain().focus().setTextAlign('left').run(), () => editor.isActive({ textAlign: 'left' })),
      btn('Align Center', AlignCenter, () => editor.chain().focus().setTextAlign('center').run(), () => editor.isActive({ textAlign: 'center' })),
      btn('Align Right', AlignRight, () => editor.chain().focus().setTextAlign('right').run(), () => editor.isActive({ textAlign: 'right' })),
    ],
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      padding: '8px 16px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {gi > 0 && (
            <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />
          )}
          {group.map((item) => {
            if (item.type === 'divider') return null;
            const active = item.isActive();
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                title={item.label}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 30,
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: active ? 'rgba(108,71,255,0.2)' : 'transparent',
                  color: active ? 'var(--color-brand-400)' : 'var(--text-secondary)',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
