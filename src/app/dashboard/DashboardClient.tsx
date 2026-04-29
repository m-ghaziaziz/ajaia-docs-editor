'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, Share2, Trash2, LogOut, Upload,
  Search, ChevronDown, Clock, Users, Crown, Eye,
  Edit3, MoreVertical, X, AlertCircle, UploadCloud
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/ui/Modal';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Document {
  id: string;
  title: string;
  word_count: number;
  updated_at: string;
  owner_name: string | null;
  owner_email: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface DashboardClientProps {
  user: User;
}

const SUPPORTED_TYPES = ['.txt', '.md', '.docx'];

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [ownedDocs, setOwnedDocs]     = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs]   = useState<Document[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState<'owned' | 'shared'>('owned');
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragActive, setDragActive]   = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function createDoc() {
    const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled Document' }) });
    const doc = await res.json();
    router.push(`/documents/${doc.id}`);
  }

  async function deleteDoc(id: string) {
    setDeletingId(id);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setOwnedDocs((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
    setMenuOpenId(null);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) {
      setUploadError(`Unsupported file type. Supported: ${SUPPORTED_TYPES.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
      } else {
        router.push(`/documents/${data.documentId}`);
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const displayDocs = (activeTab === 'owned' ? ownedDocs : sharedDocs).filter(
    (d) => d.title.toLowerCase().includes(search.toLowerCase())
  );

  const avatarLetter = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
            borderRadius: 8,
            padding: '4px 12px',
          }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>✦ Ajaia</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Docs</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
          }}>
            {avatarLetter}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name || 'You'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8, borderRadius: 8, transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Good {getGreeting()}, {user.name || user.email.split('@')[0]} 👋
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
              {ownedDocs.length} document{ownedDocs.length !== 1 ? 's' : ''} · {sharedDocs.length} shared with you
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Upload button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Upload size={16} />
              Import File
            </button>

            {/* New doc button */}
            <button
              onClick={createDoc}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.15s',
                boxShadow: '0 4px 20px rgba(108,71,255,0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(108,71,255,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,71,255,0.3)'; }}
            >
              <Plus size={18} />
              New Document
            </button>
          </div>
        </div>

        {uploadError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, color: '#fca5a5', fontSize: 14 }}>
            <AlertCircle size={16} />
            {uploadError}
            <button onClick={() => setUploadError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tabs + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4 }}>
            {(['owned', 'shared'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  background: activeTab === tab ? 'var(--bg-hover)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {tab === 'owned' ? <Crown size={13} /> : <Users size={13} />}
                {tab === 'owned' ? 'My Docs' : 'Shared with me'}
                <span style={{
                  background: activeTab === tab ? 'rgba(108,71,255,0.2)' : 'var(--bg-overlay)',
                  color: activeTab === tab ? 'var(--color-brand-400)' : 'var(--text-muted)',
                  borderRadius: 20,
                  padding: '1px 7px',
                  fontSize: 11,
                }}>
                  {tab === 'owned' ? ownedDocs.length : sharedDocs.length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 9,
                padding: '8px 12px 8px 34px',
                fontSize: 13,
                color: 'var(--text-primary)',
                outline: 'none',
                width: 220,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-500)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
        </div>

        {/* Document Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
            ))}
          </div>
        ) : displayDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <FileText size={32} color="var(--text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {search ? 'No results found' : activeTab === 'owned' ? 'No documents yet' : 'Nothing shared with you'}
            </h3>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
              {search ? `No documents matching "${search}"` : activeTab === 'owned' ? 'Create your first document to get started.' : 'Ask a teammate to share a document with you.'}
            </p>
            {!search && activeTab === 'owned' && (
              <button onClick={createDoc} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={16} />
                New Document
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {displayDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onOpen={() => router.push(`/documents/${doc.id}`)}
                onDelete={() => deleteDoc(doc.id)}
                isDeleting={deletingId === doc.id}
                isOwner={doc.role === 'owner'}
                menuOpen={menuOpenId === doc.id}
                onMenuToggle={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                onMenuClose={() => setMenuOpenId(null)}
              />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={uploadModalOpen} onClose={() => !uploading && setUploadModalOpen(false)} title="Upload Document">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-brand-500)' : 'var(--border-strong)'}`,
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(108,71,255,0.05)' : 'var(--bg-overlay)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            {uploading ? (
              <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid rgba(108,71,255,0.2)', borderTopColor: 'var(--color-brand-500)', borderRadius: '50%' }} />
            ) : (
              <UploadCloud size={28} color="var(--color-brand-400)" />
            )}
          </div>
          
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading your document...' : 'Drag and drop your file here'}
          </h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
            Supported formats: <strong>.txt, .md, .docx</strong> (Max 10MB)
          </p>
          
          {!uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 20px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand-400)'; e.currentTarget.style.color = 'var(--color-brand-500)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              Browse files
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Doc Card ────────────────────────────────────────────────
interface DocCardProps {
  doc: Document;
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isOwner: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

function DocCard({ doc, onOpen, onDelete, isDeleting, isOwner, menuOpen, onMenuToggle, onMenuClose }: DocCardProps) {
  const roleColor = {
    owner:  { bg: 'rgba(108,71,255,0.12)', text: 'var(--color-brand-400)', border: 'rgba(108,71,255,0.3)' },
    editor: { bg: 'rgba(34,197,94,0.1)',   text: '#86efac',               border: 'rgba(34,197,94,0.3)' },
    viewer: { bg: 'rgba(59,130,246,0.1)',  text: '#93c5fd',               border: 'rgba(59,130,246,0.3)' },
  }[doc.role];

  const RoleIcon = { owner: Crown, editor: Edit3, viewer: Eye }[doc.role];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={onOpen}
    >
      {/* Preview bar */}
      <div style={{ height: 6, background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))', borderTopLeftRadius: 13, borderTopRightRadius: 13 }} />

      <div style={{ padding: '16px 18px 18px' }}>
        {/* Title + Menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <FileText size={16} color="var(--color-brand-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.title}
            </span>
          </div>

          {isOwner && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', right: 0, top: 26, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 160, boxShadow: 'var(--shadow-lg)' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onMenuClose(); onOpen(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'left' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Edit3 size={14} /> Open
                  </button>
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    disabled={isDeleting}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 13, textAlign: 'left' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Trash2 size={14} /> {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: roleColor.bg,
            border: `1px solid ${roleColor.border}`,
            color: roleColor.text,
            borderRadius: 20,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
          }}>
            <RoleIcon size={10} />
            {doc.role}
          </span>

          {!isOwner && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              by {doc.owner_name || doc.owner_email.split('@')[0]}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
            <Clock size={12} />
            {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {doc.word_count > 0 ? `${doc.word_count} words` : 'Empty'}
          </span>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
