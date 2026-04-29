import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, destroySession, clearSessionCookie, getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(getSessionCookieName())?.value;
    if (token) {
      await destroySession(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[logout] Error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
