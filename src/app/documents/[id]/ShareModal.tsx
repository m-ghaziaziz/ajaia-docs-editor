'use client';

import { useState, useRef, useCallback } from 'react';
import { Share2, X, Trash2, ChevronDown, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface Share {
  id: string;
  user_email: string;
  user_name: string | null;
  permission: 'view' | 'edit';
}

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [shares, setShares]           = useState<Share[]>([]);
  const [email, setEmail]             = useState('');
  const [permission, setPermission]   = useState<'view' | 'edit'>('view');
  const [sharing, setSharing]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const loadedRef                     = useRef(false);

  const loadShares = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`);
      const data = await res.json();
      setShares(data.shares || []);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const handleOpen = () => { loadedRef.current = false; loadShares(); };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSharing(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), permission }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to share');
      } else {
        setSuccess(`Shared with ${email}`);
        setEmail('');
        loadedRef.current = false;
        loadShares();
      }
    } catch {
      setError('Network error');
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    await fetch(`/api/documents/${documentId}/shares/${shareId}`, { method: 'DELETE' });
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  const handlePermChange = async (shareId: string, perm: 'view' | 'edit') => {
    await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission: perm }),
    });
    setShares((prev) => prev.map((s) => s.id === shareId ? { ...s, permission: perm } : s));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document" size="md">
      <div onLoad={handleOpen}>
        {/* Share form */}
        <form onSubmit={handleShare} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Invite by email
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
              placeholder="colleague@example.com"
              required
              style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 9,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-500)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
            {/* Permission select */}
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 9,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
            <button
              type="submit"
              disabled={sharing || !email.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
                border: 'none',
                borderRadius: 9,
                padding: '10px 18px',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: sharing ? 'not-allowed' : 'pointer',
                opacity: sharing ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {sharing ? '…' : 'Share'}
            </button>
          </div>

          {error   && <p style={{ margin: '8px 0 0', color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}
          {success && <p style={{ margin: '8px 0 0', color: 'var(--color-success)', fontSize: 13 }}>✓ {success}</p>}
        </form>

        {/* People with access */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            People with access
          </p>

          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
          ) : shares.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              Not shared with anyone yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shares.map((share) => (
                <div key={share.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {(share.user_name || share.user_email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {share.user_name || share.user_email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {share.user_email}
                    </div>
                  </div>
                  <select
                    value={share.permission}
                    onChange={(e) => handlePermChange(share.id, e.target.value as 'view' | 'edit')}
                    style={{
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 7,
                      padding: '5px 8px',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    title="Revoke access"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
