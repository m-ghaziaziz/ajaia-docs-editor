'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Save, Check, Clock, Upload, Pencil, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import ShareModal from './ShareModal';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

interface DocData {
  id: string;
  title: string;
  content: object | null;
  canEdit: boolean;
  isOwner: boolean;
  word_count: number;
  last_saved_at: string;
}

interface CurrentUser { id: string; email: string; name: string | null; }

export default function EditorClient({ documentId, currentUser }: { documentId: string; currentUser: CurrentUser }) {
  const router = useRouter();
  const [doc, setDoc]               = useState<DocData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [shareOpen, setShareOpen]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const saveTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContent              = useRef<{ json: object; text: string } | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Fetch document
  useEffect(() => {
    fetch(`/api/documents/${documentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); }
        else { setDoc(data); setTitleValue(data.title); }
      })
      .catch(() => setError('Failed to load document'))
      .finally(() => setLoading(false));
  }, [documentId]);

  // Autosave — debounced 2s
  const triggerSave = useCallback(async (overrideContent?: { json: object; text: string }) => {
    const toSave = overrideContent || pendingContent.current;
    if (!toSave) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: toSave.json, contentText: toSave.text }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        pendingContent.current = null;
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  }, [documentId]);

  const handleContentUpdate = useCallback((json: object, text: string) => {
    pendingContent.current = { json, text };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => triggerSave({ json, text }), 2000);
  }, [triggerSave]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pendingContent.current) triggerSave();
    };
  }, [triggerSave]);

  // Save title
  const saveTitle = async (title: string) => {
    const trimmed = title.trim() || 'Untitled Document';
    setTitleValue(trimmed);
    setEditingTitle(false);
    setDoc((prev) => prev ? { ...prev, title: trimmed } : prev);
    await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
  };

  // Import file into this doc
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.content) {
        setDoc((prev) => prev ? { ...prev, content: data.content } : prev);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(108,71,255,0.2)', borderTopColor: 'var(--color-brand-500)', borderRadius: '50%' }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--color-brand-500)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
    </div>
  );

  if (!doc) return null;

  const SaveIcon = saveStatus === 'saved' ? Check : Save;
  const saveColors = { idle: 'var(--text-muted)', saving: 'var(--color-warning)', saved: 'var(--color-success)', error: 'var(--color-error)' };
  const saveLabels = { idle: '', saving: 'Saving…', saved: 'Saved', error: 'Error saving' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 20px',
        height: 56,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '6px 8px', borderRadius: 7, transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={15} /> Dashboard
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => saveTitle(titleValue)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(titleValue); if (e.key === 'Escape') { setTitleValue(doc.title); setEditingTitle(false); } }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-brand-500)', borderRadius: 7, padding: '5px 10px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, outline: 'none', minWidth: 200, maxWidth: 400 }}
          />
        ) : (
          <button
            onClick={() => doc.canEdit && setEditingTitle(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: doc.canEdit ? 'pointer' : 'default', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, padding: '5px 8px', borderRadius: 7, transition: 'background 0.12s', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { if (doc.canEdit) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {doc.title}
            {doc.canEdit && <Pencil size={12} color="var(--text-muted)" />}
          </button>
        )}

        {/* Save status */}
        {saveStatus !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: saveColors[saveStatus], fontSize: 12 }}>
            {saveStatus === 'saving' ? (
              <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: 'var(--color-warning)', borderRadius: '50%' }} />
            ) : (
              <SaveIcon size={13} />
            )}
            {saveLabels[saveStatus]}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Import */}
        {doc.canEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <Upload size={14} />
            {uploading ? 'Importing…' : 'Import'}
            <input ref={fileInputRef} type="file" accept=".txt,.md,.docx" onChange={handleFileImport} style={{ display: 'none' }} disabled={uploading} />
          </label>
        )}

        {/* Share */}
        {doc.isOwner && (
          <button
            onClick={() => setShareOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))', border: 'none', borderRadius: 8, padding: '7px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(108,71,255,0.3)', transition: 'transform 0.1s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Share2 size={14} /> Share
          </button>
        )}
      </header>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-app)' }}>
        <TiptapEditor
          content={doc.content}
          canEdit={doc.canEdit}
          onUpdate={handleContentUpdate}
        />
      </div>

      {doc.isOwner && (
        <ShareModal documentId={documentId} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
