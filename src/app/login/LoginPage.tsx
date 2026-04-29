'use client';

import { useState } from 'react';
import { Mail, Sparkles, FileText, Share2, Zap } from 'lucide-react';

const features = [
  { icon: FileText, label: 'Rich Text Editing', desc: 'Bold, italic, headings, lists & more' },
  { icon: Share2,   label: 'Instant Sharing',  desc: 'Share docs with view or edit access' },
  { icon: Zap,      label: 'Auto-save',         desc: 'Never lose a word — saved as you type' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      } else {
        setStatus('sent');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-app)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        left: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(108,71,255,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-200px',
        right: '-100px',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Left Panel — Branding */}
      <div style={{
        display: 'none',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        background: 'linear-gradient(180deg, rgba(108,71,255,0.08) 0%, transparent 100%)',
        borderRight: '1px solid var(--border-subtle)',
        ...(typeof window !== 'undefined' && window.innerWidth > 900 ? { display: 'flex' } : {}),
      }}
      className="login-panel-left"
      >
        {/* Logo */}
        <div style={{ marginBottom: 60 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
            borderRadius: 14,
            padding: '10px 18px',
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>✦ Ajaia</span>
          </div>
        </div>

        <h1 style={{
          fontSize: 42,
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}>
          Write, share,<br />
          <span className="gradient-text">collaborate.</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: 48,
          maxWidth: 400,
        }}>
          A professional document editor built for teams who move fast. No passwords. No friction.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(108,71,255,0.12)',
                border: '1px solid rgba(108,71,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} color="var(--color-brand-400)" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">
          {/* Mobile logo */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
              borderRadius: 12,
              padding: '8px 16px',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>✦ Ajaia Docs</span>
            </div>
          </div>

          {status === 'sent' ? (
            // ── Sent State ──
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 32px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <Mail size={28} color="#22c55e" />
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                Check your inbox
              </h2>
              <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                We sent a magic link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                Click it to sign in — no password needed.
              </p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                The link expires in 15 minutes.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                style={{
                  marginTop: 24,
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-400)',
                  cursor: 'pointer',
                  fontSize: 14,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            // ── Form State ──
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Welcome back
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
                  Enter your email to receive a sign-in link.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.3px' }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="var(--text-muted)"
                      style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={status === 'loading'}
                      style={{
                        width: '100%',
                        background: 'var(--bg-elevated)',
                        border: `1px solid ${status === 'error' ? 'var(--color-error)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        padding: '13px 14px 13px 42px',
                        color: 'var(--text-primary)',
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-brand-500)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = status === 'error' ? 'var(--color-error)' : 'var(--border-subtle)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  {status === 'error' && (
                    <p style={{ margin: '8px 0 0', color: 'var(--color-error)', fontSize: 13 }}>
                      {errorMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !email.trim()}
                  style={{
                    width: '100%',
                    background: status === 'loading' || !email.trim()
                      ? 'rgba(108,71,255,0.4)'
                      : 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'opacity 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (status !== 'loading') e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {status === 'loading' ? (
                    <>
                      <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                      Sending link…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Send Magic Link
                    </>
                  )}
                </button>
              </form>

              <p style={{ margin: '20px 0 0', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
                By signing in, you agree to our Terms of Service.
                <br />No account? One will be created automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Left panel responsive CSS */}
      <style>{`
        @media (min-width: 900px) {
          .login-panel-left { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
