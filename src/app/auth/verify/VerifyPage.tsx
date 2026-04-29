'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMsg('No token provided.');
      setStatus('error');
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Verification failed.');
          setStatus('error');
        } else {
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1200);
        }
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setStatus('error');
      });
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: 24,
    }}>
      <div className="animate-fade-in" style={{
        textAlign: 'center',
        maxWidth: 360,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 32px',
        boxShadow: 'var(--shadow-glow)',
      }}>
        {status === 'verifying' && (
          <>
            <div className="animate-spin" style={{
              width: 52,
              height: 52,
              border: '3px solid rgba(108,71,255,0.2)',
              borderTopColor: 'var(--color-brand-500)',
              borderRadius: '50%',
              margin: '0 auto 24px',
            }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Verifying your link…
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
              Please wait a moment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={28} color="#22c55e" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              You&apos;re in!
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
              Redirecting to your dashboard…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <XCircle size={28} color="#ef4444" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Link invalid
            </h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-purple))',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
