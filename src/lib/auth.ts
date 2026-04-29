import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query, queryOne, execute } from './db';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production'
);

const SESSION_COOKIE = 'ajaia_session';
const SESSION_TTL_DAYS = 7;
const MAGIC_LINK_TTL_MINUTES = 15;

// ─── Types ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SessionPayload {
  userId: string;
  sessionId: string;
}

// ─── JWT Helpers ──────────────────────────────────────────

export async function signToken(payload: SessionPayload, expiresIn = `${SESSION_TTL_DAYS}d`): Promise<string> {
  return new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Magic Link ───────────────────────────────────────────

export async function createMagicLink(email: string): Promise<{ token: string; userId: string }> {
  // Upsert user
  const existing = await queryOne<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const name = email.split('@')[0];
    await execute(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name]
    );
    const newUser = await queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
    userId = newUser!.id;
  }

  // Generate a signed JWT as the magic-link token (15 min TTL)
  const magicToken = await signToken({ userId, sessionId: '' }, `${MAGIC_LINK_TTL_MINUTES}m`);

  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
  await execute(
    'INSERT INTO magic_links (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, magicToken, expiresAt]
  );

  return { token: magicToken, userId };
}

export async function verifyMagicLink(token: string): Promise<User | null> {
  // Check DB record
  const now = new Date();
  
  // Debug log to see if the token exists at all
  const rawRecord = await queryOne<{ id: string, expires_at: Date, used_at: Date | null }>(
    'SELECT id, expires_at, used_at FROM magic_links WHERE token = ?',
    [token]
  );
  console.log('[verifyMagicLink] Raw record check:', rawRecord, 'Current Node Time:', now);

  const record = await queryOne<{
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    used_at: Date | null;
  }>(
    'SELECT * FROM magic_links WHERE token = ? AND used_at IS NULL AND expires_at > ?',
    [token, now]
  );

  if (!record) {
    console.log('[verifyMagicLink] Token invalid. Was it used or expired?');
    return null;
  }

  // Mark as used
  await execute('UPDATE magic_links SET used_at = ? WHERE id = ?', [now, record.id]);

  // Get user
  const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [record.user_id]);
  return user;
}

// ─── Sessions ─────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const token = await signToken({ userId, sessionId }, `${SESSION_TTL_DAYS}d`);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await execute(
    'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [sessionId, userId, tokenHash, expiresAt]
  );

  return token;
}

export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
}

// ─── Auth Guard ───────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Validate session exists and is not expired
  const tokenHash = hashToken(token);
  const session = await queryOne<{ id: string; user_id: string; expires_at: Date }>(
    'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?',
    [tokenHash, new Date()]
  );
  if (!session) return null;

  const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [session.user_id]);
  return user;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}
